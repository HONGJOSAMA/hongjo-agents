#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { runUncertaintyAgentV1 } from "./uncertainty_agent_v1.mjs";
import { runAdversarialAgentV1 } from "./adversarial_agent_v1.mjs";
import { runPolicyAgentV1 } from "./policy_agent_v1.mjs";

const ROOT_DIR = process.cwd();
const inputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-meta-agent-input-v1.json");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-meta-agent-output-v1.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-meta-agent-run.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-meta-agent-run.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const input = readJson(inputPath);
const outputs = {
  schemaVersion: "phase4-meta-agent-output/v1",
  organizationId: input.organizationId,
  context: input.context,
  uncertainty: runUncertaintyAgentV1(input),
  adversarial: runAdversarialAgentV1(input),
  policy: runPolicyAgentV1(input),
  evaluatedAt: new Date().toISOString(),
};

const failures = [];
for (const [key, value] of Object.entries({
  uncertainty: outputs.uncertainty,
  adversarial: outputs.adversarial,
  policy: outputs.policy,
})) {
  if (value.status !== "ok") {
    failures.push(`${key}:status_invalid`);
  }
}

const pass = failures.length === 0;
const summary = {
  pass,
  schemaVersion: outputs.schemaVersion,
  evaluatedAt: outputs.evaluatedAt,
  outputs: {
    uncertaintySeverity: outputs.uncertainty.severity,
    adversarialTargetDomain: outputs.adversarial.targetDomain,
    policyActionPriority: outputs.policy.actionPriority,
  },
  failures,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(outputs, null, 2)}\n`, "utf8");

const md = `# Phase 4 Meta Agent Run

- Status: ${pass ? "pass" : "fail"}
- Schema Version: ${outputs.schemaVersion}
- Uncertainty Severity: ${outputs.uncertainty.severity}
- Adversarial Target: ${outputs.adversarial.targetDomain}
- Policy Action Priority: ${outputs.policy.actionPriority}
- Evaluated At: ${outputs.evaluatedAt}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase4_meta_agent_run_pass=${pass}`);
console.log(`phase4_meta_agent_run_output=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`phase4_meta_agent_run_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);

if (!pass) {
  process.exitCode = 1;
}
