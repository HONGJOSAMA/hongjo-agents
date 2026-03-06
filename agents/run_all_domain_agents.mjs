#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { domainRegistry } from "./common/registry.mjs";

const ROOT_DIR = process.cwd();
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase3-domain-agent-smoke.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase3-domain-agent-smoke.json");

const results = [];
const failures = [];

for (const entry of domainRegistry) {
  const { domainKey, runAgent } = entry;
  try {
    const result = await runAgent();
    const valid = Boolean(
      result?.schemaVersion &&
        result?.contractVersion &&
        result?.input?.filteredRowCount >= 3 &&
        result?.scoring?.riskLevel &&
        result?.trace?.selectedRuleIds?.length >= 3 &&
        result?.validation?.schemaCheckPassed === true &&
      result?.hypothesis &&
        result?.prediction &&
        Array.isArray(result?.evidence) &&
        result.evidence.length >= 3,
    );
    results.push({
      domainKey,
      valid,
      evidenceCount: result?.evidence?.length ?? 0,
      outputPath: result?.outputPath ?? null,
    });
    if (!valid) {
      failures.push(`agent_output_invalid:${domainKey}`);
    }
  } catch (error) {
    failures.push(`agent_run_failed:${domainKey}:${String(error?.message || error)}`);
    results.push({
      domainKey,
      valid: false,
      evidenceCount: 0,
      outputPath: null,
    });
  }
}

const successRate = Number((((results.length - failures.length) / results.length) * 100).toFixed(2));
const pass = failures.length === 0;

const summary = {
  pass,
  successRate,
  totalAgents: results.length,
  failures,
  results,
  evaluatedAt: new Date().toISOString(),
};

const md = `# Phase 3 Domain Agent Smoke

- Status: ${pass ? "pass" : "fail"}
- Total Agents: ${results.length}
- Success Rate: ${successRate}%
- Evaluated At: ${summary.evaluatedAt}

## Results
${results.map((item) => `- ${item.domainKey}: ${item.valid ? "pass" : "fail"} (evidence=${item.evidenceCount})`).join("\n")}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase3_domain_agents_pass=${pass}`);
console.log(`phase3_domain_agents_success_rate=${successRate}`);
console.log(`phase3_domain_agents_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);
console.log(`phase3_domain_agents_report_json=${path.relative(ROOT_DIR, reportJsonPath)}`);

if (!pass) {
  process.exitCode = 1;
}
