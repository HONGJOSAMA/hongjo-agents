#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const contractPath = path.resolve(ROOT_DIR, "foundation/evidence/evidence_pack_contract_v1.json");
const orchestratorOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json");
const calibratedOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-calibrated-output-v1.json");
const metaOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-meta-agent-output-v1.json");
const inputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-orchestrator-input-v1.json");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/evidence/phase5-evidence-pack-v1.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase5-evidence-pack-smoke.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase5-evidence-pack-smoke.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getValue(target, fieldPath) {
  return fieldPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function validateFields(target, fields, prefix) {
  return fields.filter((field) => getValue(target, field) === undefined).map((field) => `${prefix}:${field}`);
}

const contract = readJson(contractPath);
const orchestratorOutput = readJson(orchestratorOutputPath);
const calibratedOutput = readJson(calibratedOutputPath);
const metaOutput = readJson(metaOutputPath);
const orchestratorInput = readJson(inputPath);

const items = orchestratorInput.evidencePack.map((item, index) => ({
  ...item,
  citationLabel: `E${String(index + 1).padStart(2, "0")}`,
}));

const dissentHighlights = orchestratorOutput.dissentLog.map((item) => ({
  domainKey: item.domainKey,
  reason: item.dissentReason,
  severity: item.dissentScore >= 0.15 ? "high" : item.dissentScore >= 0.05 ? "medium" : "low",
}));

const evidencePack = {
  schemaVersion: contract.schemaVersion,
  organizationId: orchestratorOutput.organizationId,
  context: {
    trainingSessionId: orchestratorOutput.context.trainingSessionId,
    aarReportId: orchestratorOutput.context.aarReportId,
    selectedPolicyRule: orchestratorOutput.strategy.selectedPolicyRule,
  },
  summary: {
    finalProbability: orchestratorOutput.finalPrediction.probability,
    finalConfidence: orchestratorOutput.finalPrediction.confidence,
    calibratedProbability: calibratedOutput.calibratedPrediction.probability,
    riskLevel: orchestratorOutput.finalPrediction.riskLevel,
    uncertaintySeverity: metaOutput.uncertainty.severity,
    policyActionPriority: metaOutput.policy.actionPriority,
  },
  items,
  dissentHighlights,
};

const failures = [
  ...validateFields(evidencePack, contract.requiredTopLevel, "top_level"),
  ...validateFields(evidencePack.context, contract.requiredContextFields, "context"),
  ...validateFields(evidencePack.summary, contract.requiredSummaryFields, "summary"),
];

for (const item of evidencePack.items) {
  failures.push(...validateFields(item, contract.requiredItemFields, `item:${item.domainKey}`));
}
for (const item of evidencePack.dissentHighlights) {
  failures.push(...validateFields(item, contract.requiredDissentFields, `dissent:${item.domainKey}`));
}

const pass = failures.length === 0 && evidencePack.items.length >= 3;
const summary = {
  pass,
  schemaVersion: evidencePack.schemaVersion,
  itemCount: evidencePack.items.length,
  dissentCount: evidencePack.dissentHighlights.length,
  evaluatedAt: new Date().toISOString(),
  failures,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(evidencePack, null, 2)}\n`, "utf8");

const md = `# Phase 5 Evidence Pack Smoke

- Status: ${pass ? "pass" : "fail"}
- Schema Version: ${evidencePack.schemaVersion}
- Item Count: ${evidencePack.items.length}
- Dissent Count: ${evidencePack.dissentHighlights.length}
- Evaluated At: ${summary.evaluatedAt}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase5_evidence_pack_pass=${pass}`);
console.log(`phase5_evidence_pack_output=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`phase5_evidence_pack_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);

if (!pass) {
  process.exitCode = 1;
}
