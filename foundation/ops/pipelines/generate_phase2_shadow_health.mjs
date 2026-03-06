#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const paths = {
  quality: path.resolve(
    rootDir,
    process.env.PHASE2_QUALITY_SUMMARY || "foundation/evaluation/metrics/data_quality_summary.json",
  ),
  security: path.resolve(
    rootDir,
    process.env.PHASE2_SECURITY_REPORT || "foundation/evaluation/metrics/phase2-security-scan-report.json",
  ),
  liveGate: path.resolve(
    rootDir,
    process.env.PHASE2_LIVE_GATE_REPORT || "foundation/evaluation/metrics/phase2-live-gate-report.json",
  ),
  domainHealth: path.resolve(
    rootDir,
    process.env.PHASE2_DOMAIN_HEALTH_REPORT || "foundation/evaluation/metrics/phase2-domain-health.json",
  ),
  readiness: path.resolve(
    rootDir,
    process.env.PHASE2_READINESS_REPORT || "foundation/evaluation/metrics/phase2-readiness-snapshot.json",
  ),
  outputMd: path.resolve(
    rootDir,
    process.env.PHASE2_SHADOW_HEALTH_MD || "foundation/evaluation/metrics/phase2-shadow-health.md",
  ),
  outputJson: path.resolve(
    rootDir,
    process.env.PHASE2_SHADOW_HEALTH_JSON || "foundation/evaluation/metrics/phase2-shadow-health.json",
  ),
};

function rel(filePath) {
  const r = path.relative(rootDir, filePath);
  if (r && !r.startsWith("..") && !path.isAbsolute(r)) {
    return r;
  }
  return path.basename(filePath);
}

function readJsonOrNull(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

const quality = readJsonOrNull(paths.quality);
const security = readJsonOrNull(paths.security);
const liveGate = readJsonOrNull(paths.liveGate);
const domainHealth = readJsonOrNull(paths.domainHealth);
const readiness = readJsonOrNull(paths.readiness);

const minIngest = Number(process.env.PIPELINE_MIN_INGEST_SUCCESS_RATE || 95);
const maxMissing = Number(process.env.PIPELINE_MAX_MISSING_RATE || 5);
const maxDuplicate = Number(process.env.PIPELINE_MAX_DUPLICATE_RATE || 2);

const qualityPass = Boolean(
  quality &&
    typeof quality.ingestSuccessRate === "number" &&
    typeof quality.missingRate === "number" &&
    typeof quality.duplicateRate === "number" &&
    quality.ingestSuccessRate >= minIngest &&
    quality.missingRate <= maxMissing &&
    quality.duplicateRate <= maxDuplicate,
);

const securityPass = Boolean(security?.pass === true);
const liveGatePass = Boolean(liveGate?.passed === true);
const domainHealthPass = Boolean(domainHealth?.pass === true);
const readinessAllReady = Boolean(readiness?.allReady === true);

const status = qualityPass && securityPass && liveGatePass && domainHealthPass ? "green" : "yellow";
const evaluatedAt = new Date().toISOString();

const summary = {
  status,
  checks: {
    qualityPass,
    securityPass,
    liveGatePass,
    domainHealthPass,
    readinessAllReady,
  },
  metrics: {
    ingestSuccessRate: quality?.ingestSuccessRate ?? null,
    missingRate: quality?.missingRate ?? null,
    duplicateRate: quality?.duplicateRate ?? null,
    quarantineRows: quality?.quarantineRows ?? null,
    securityFindings: security?.findingCount ?? null,
    liveGateFailures: Array.isArray(liveGate?.failures) ? liveGate.failures.length : null,
    domainHealthMissing: Array.isArray(domainHealth?.missingDomains) ? domainHealth.missingDomains.length : null,
    domainHealthMaxShare: domainHealth?.maxShare ?? null,
  },
  inputs: {
    quality: rel(paths.quality),
    security: rel(paths.security),
    liveGate: rel(paths.liveGate),
    domainHealth: rel(paths.domainHealth),
    readiness: rel(paths.readiness),
  },
  evaluatedAt,
};

const md = `# Phase 2 Shadow Health

- Status: ${status}
- Evaluated At: ${evaluatedAt}

## Check Summary
- qualityPass: ${qualityPass ? "yes" : "no"}
- securityPass: ${securityPass ? "yes" : "no"}
- liveGatePass: ${liveGatePass ? "yes" : "no"}
- domainHealthPass: ${domainHealthPass ? "yes" : "no"}
- readinessAllReady: ${readinessAllReady ? "yes" : "no"}

## Metrics
- ingestSuccessRate: ${summary.metrics.ingestSuccessRate ?? "n/a"}
- missingRate: ${summary.metrics.missingRate ?? "n/a"}
- duplicateRate: ${summary.metrics.duplicateRate ?? "n/a"}
- quarantineRows: ${summary.metrics.quarantineRows ?? "n/a"}
- securityFindings: ${summary.metrics.securityFindings ?? "n/a"}
- liveGateFailures: ${summary.metrics.liveGateFailures ?? "n/a"}
- domainHealthMissing: ${summary.metrics.domainHealthMissing ?? "n/a"}
- domainHealthMaxShare: ${summary.metrics.domainHealthMaxShare ?? "n/a"}

## Source Files
- quality: \`${summary.inputs.quality}\`
- security: \`${summary.inputs.security}\`
- liveGate: \`${summary.inputs.liveGate}\`
- domainHealth: \`${summary.inputs.domainHealth}\`
- readiness: \`${summary.inputs.readiness}\`
`;

fs.mkdirSync(path.dirname(paths.outputMd), { recursive: true });
fs.writeFileSync(paths.outputMd, md, "utf8");
fs.writeFileSync(paths.outputJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase2_shadow_health_status=${status}`);
console.log(`phase2_shadow_health_md=${rel(paths.outputMd)}`);
console.log(`phase2_shadow_health_json=${rel(paths.outputJson)}`);
