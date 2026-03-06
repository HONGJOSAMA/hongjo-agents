#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const reportMdPath = path.resolve(
  rootDir,
  process.env.PHASE2_SECURITY_REPORT_MD || "foundation/evaluation/metrics/phase2-security-scan-report.md",
);
const reportJsonPath = path.resolve(
  rootDir,
  process.env.PHASE2_SECURITY_REPORT_JSON || "foundation/evaluation/metrics/phase2-security-scan-report.json",
);

function toProjectRelative(targetPath) {
  const relative = path.relative(rootDir, targetPath);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative;
  }
  return path.basename(targetPath);
}

const includeRoots = [
  ".github/workflows",
  "foundation/ops/pipelines",
  "foundation/docs",
  "multi_agent_plan.md",
  "multi_agent_report.md",
];

const scanPatterns = [
  {
    id: "openai_key",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
    severity: "high",
  },
  {
    id: "github_pat",
    regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
    severity: "high",
  },
  {
    id: "aws_access_key",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: "high",
  },
  {
    id: "private_key_marker",
    regex: /-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----/g,
    severity: "high",
  },
  {
    id: "password_assignment",
    regex: /\b(password|passwd)\b\s*[:=]\s*["'][^"']{4,}["']/gi,
    severity: "medium",
  },
];

const allowedPatterns = [
  /YOUR_SECRET_NAME/,
  /example/i,
  /sample/i,
  /placeholder/i,
];

const textExtensions = new Set([
  ".md",
  ".mjs",
  ".js",
  ".json",
  ".yaml",
  ".yml",
  ".txt",
  ".prisma",
]);

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  if (!textExtensions.has(ext)) {
    return false;
  }
  if (filePath.includes("/.git/")) {
    return false;
  }
  return true;
}

function listFiles(targetPath) {
  const absolute = path.resolve(rootDir, targetPath);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    return [absolute];
  }
  const output = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const childPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) {
      output.push(...listFiles(path.relative(rootDir, childPath)));
    } else if (entry.isFile()) {
      output.push(childPath);
    }
  }
  return output;
}

function scanFile(filePath) {
  const rel = toProjectRelative(filePath);
  const text = fs.readFileSync(filePath, "utf8");
  const findings = [];

  for (const pattern of scanPatterns) {
    for (const match of text.matchAll(pattern.regex)) {
      const token = match[0];
      if (allowedPatterns.some((allow) => allow.test(token))) {
        continue;
      }
      findings.push({
        file: rel,
        pattern: pattern.id,
        severity: pattern.severity,
        sample: token.slice(0, 80),
      });
    }
  }
  return findings;
}

const files = includeRoots
  .flatMap((target) => listFiles(target))
  .filter(shouldScanFile);

const findings = files.flatMap((filePath) => scanFile(filePath));
const strict = (process.env.PHASE2_SECURITY_SCAN_STRICT || "1") !== "0";
const pass = findings.length === 0;

const summary = {
  pass,
  strict,
  filesScanned: files.map((p) => toProjectRelative(p)),
  findingCount: findings.length,
  findings,
  evaluatedAt: new Date().toISOString(),
};

const md = `# Phase 2 Security Scan Report

- Status: ${pass ? "pass" : "fail"}
- Strict Mode: ${strict}
- Files Scanned: ${summary.filesScanned.length}
- Findings: ${findings.length}
- Evaluated At: ${summary.evaluatedAt}

## Findings
${findings.length === 0 ? "- none" : findings.map((f) => `- [${f.severity}] ${f.pattern} @ \`${f.file}\``).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase2_security_pass=${pass}`);
console.log(`phase2_security_strict=${strict}`);
console.log(`phase2_security_findings=${findings.length}`);
console.log(`phase2_security_report_md=${toProjectRelative(reportMdPath)}`);
console.log(`phase2_security_report_json=${toProjectRelative(reportJsonPath)}`);

if (!pass && strict) {
  process.exitCode = 1;
}

