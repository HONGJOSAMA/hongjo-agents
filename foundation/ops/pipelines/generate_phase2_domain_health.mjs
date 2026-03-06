#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const normalizedPath = path.resolve(
  rootDir,
  process.env.NORMALIZED_OUTPUT || "foundation/data/normalized/phase2-normalized-sample.jsonl",
);
const reportMdPath = path.resolve(
  rootDir,
  process.env.PHASE2_DOMAIN_HEALTH_MD || "foundation/evaluation/metrics/phase2-domain-health.md",
);
const reportJsonPath = path.resolve(
  rootDir,
  process.env.PHASE2_DOMAIN_HEALTH_JSON || "foundation/evaluation/metrics/phase2-domain-health.json",
);

function rel(targetPath) {
  const relative = path.relative(rootDir, targetPath);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative;
  }
  return path.basename(targetPath);
}

function parseExpectedDomains(raw) {
  if (!raw) {
    return [
      "macroeconomy",
      "policy_politics",
      "geopolitics_security",
      "supply_chain_trade",
      "cyber_information",
    ];
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const expectedDomains = parseExpectedDomains(process.env.PHASE2_EXPECTED_DOMAINS || "");
const concentrationLimit = Number(process.env.PHASE2_DOMAIN_MAX_SHARE || 60);
const minRecordsPerDomain = Number(process.env.PHASE2_DOMAIN_MIN_RECORDS || 1);

const rows = readJsonl(normalizedPath);
const counts = {};

for (const row of rows) {
  const key = row.domainKey || "__missing__";
  counts[key] = (counts[key] || 0) + 1;
}

const total = rows.length;
const missingDomains = expectedDomains.filter((domain) => (counts[domain] || 0) < minRecordsPerDomain);
const domainShares = expectedDomains.map((domain) => {
  const count = counts[domain] || 0;
  const share = total === 0 ? 0 : Number(((count / total) * 100).toFixed(2));
  return { domain, count, share };
});
const maxShare = domainShares.reduce((acc, item) => Math.max(acc, item.share), 0);
const pass = total > 0 && missingDomains.length === 0 && maxShare <= concentrationLimit;

const summary = {
  pass,
  total,
  expectedDomains,
  minRecordsPerDomain,
  concentrationLimit,
  counts,
  missingDomains,
  maxShare,
  domainShares,
  source: rel(normalizedPath),
  evaluatedAt: new Date().toISOString(),
};

const md = `# Phase 2 Domain Health

- Status: ${pass ? "pass" : "fail"}
- Source: \`${summary.source}\`
- Evaluated At: ${summary.evaluatedAt}
- Total Records: ${total}
- Missing Domains: ${missingDomains.length}
- Max Domain Share: ${maxShare}%

## Expected Domains
${expectedDomains.map((domain) => `- ${domain}: ${counts[domain] || 0}`).join("\n")}

## Gate
- min records per domain >= ${minRecordsPerDomain}
- max domain share <= ${concentrationLimit}%

## Missing Domains
${missingDomains.length === 0 ? "- none" : missingDomains.map((domain) => `- ${domain}`).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase2_domain_health_pass=${pass}`);
console.log(`phase2_domain_health_total=${total}`);
console.log(`phase2_domain_health_missing=${missingDomains.length}`);
console.log(`phase2_domain_health_max_share=${maxShare}`);
console.log(`phase2_domain_health_md=${rel(reportMdPath)}`);
console.log(`phase2_domain_health_json=${rel(reportJsonPath)}`);

if (!pass && (process.env.PHASE2_DOMAIN_HEALTH_STRICT || "0") === "1") {
  process.exitCode = 1;
}
