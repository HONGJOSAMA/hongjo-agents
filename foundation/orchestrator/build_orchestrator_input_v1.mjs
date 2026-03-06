#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const contractPath = path.resolve(ROOT_DIR, "foundation/orchestrator/input_contract_v1.json");
const contextPath = path.resolve(ROOT_DIR, "foundation/data/specialforce/specialforce-context-sample.json");
const agentOutputDir = path.resolve(ROOT_DIR, "foundation/evaluation/agents/specialforce_context");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-orchestrator-input-v1.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-orchestrator-input-smoke.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-orchestrator-input-smoke.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getValue(target, fieldPath) {
  return fieldPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function validateFields(target, fields, prefix) {
  return fields.filter((field) => getValue(target, field) === undefined).map((field) => `${prefix}:${field}`);
}

if (!fs.existsSync(contextPath)) {
  console.error(`missing_context:${path.relative(ROOT_DIR, contextPath)}`);
  process.exit(1);
}

if (!fs.existsSync(agentOutputDir)) {
  console.error(`missing_agent_output_dir:${path.relative(ROOT_DIR, agentOutputDir)}`);
  process.exit(1);
}

const contract = readJson(contractPath);
const context = readJson(contextPath);
const outputs = fs
  .readdirSync(agentOutputDir)
  .filter((name) => name.endsWith(".json"))
  .map((name) => ({
    outputPath: path.relative(ROOT_DIR, path.resolve(agentOutputDir, name)),
    payload: readJson(path.resolve(agentOutputDir, name)),
  }));

const averageProbability = Number(
  (
    outputs.reduce((acc, item) => acc + (item.payload.prediction?.probability || 0), 0) /
    Math.max(outputs.length, 1)
  ).toFixed(2),
);

const riskRank = { low: 1, medium: 2, high: 3 };
const maxRiskLevel = outputs
  .map((item) => item.payload.prediction?.riskLevel || "low")
  .sort((left, right) => riskRank[right] - riskRank[left])[0] || "low";

const orchestratorInput = {
  schemaVersion: contract.schemaVersion,
  organizationId: context.organizationId,
  context: {
    trainingSessionId: context.trainingSession.id,
    aarReportId: context.aarReport.id,
    actionItemIds: context.actionItems.map((item) => item.id),
    sourceContext: path.relative(ROOT_DIR, contextPath),
  },
  aggregate: {
    domainCount: outputs.length,
    averageProbability,
    maxRiskLevel,
    selectedPolicyRule: "minimax_regret",
  },
  domainRuns: outputs.map((item) => ({
    domainKey: item.payload.domainKey,
    agentId: item.payload.agentId,
    probability: item.payload.prediction.probability,
    confidence: item.payload.prediction.confidence,
    riskLevel: item.payload.prediction.riskLevel,
    evidenceCount: item.payload.evidence.length,
    outputPath: item.outputPath,
  })),
  evidencePack: outputs.flatMap((item) =>
    item.payload.evidence.slice(0, 2).map((evidenceItem) => ({
      domainKey: item.payload.domainKey,
      evidenceId: evidenceItem.id,
      sourceTitle: evidenceItem.sourceTitle,
      trustScore: evidenceItem.trustScore,
      excerpt: evidenceItem.excerpt,
    })),
  ),
  dissentLog: outputs
    .filter((item) => item.payload.scoring.riskLevel === "high" && item.payload.prediction.probability < 0.75)
    .map((item) => ({
      domainKey: item.payload.domainKey,
      reason: "high-risk but sub-critical confidence",
      probability: item.payload.prediction.probability,
    })),
};

const failures = [
  ...validateFields(orchestratorInput, contract.requiredTopLevel, "top_level"),
  ...validateFields(orchestratorInput.context, contract.requiredContextFields, "context"),
  ...validateFields(orchestratorInput.aggregate, contract.requiredAggregateFields, "aggregate"),
];

for (const item of orchestratorInput.domainRuns) {
  failures.push(...validateFields(item, contract.requiredDomainRunFields, `domain_run:${item.domainKey}`));
}
for (const item of orchestratorInput.evidencePack) {
  failures.push(...validateFields(item, contract.requiredEvidencePackFields, `evidence_pack:${item.domainKey}`));
}

const pass = failures.length === 0;
const summary = {
  pass,
  schemaVersion: contract.schemaVersion,
  evaluatedAt: new Date().toISOString(),
  failures,
  aggregate: orchestratorInput.aggregate,
  context: orchestratorInput.context,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(orchestratorInput, null, 2)}\n`, "utf8");

const md = `# Phase 4 Orchestrator Input Smoke

- Status: ${pass ? "pass" : "fail"}
- Schema Version: ${contract.schemaVersion}
- Domain Count: ${orchestratorInput.aggregate.domainCount}
- Average Probability: ${orchestratorInput.aggregate.averageProbability}
- Max Risk Level: ${orchestratorInput.aggregate.maxRiskLevel}
- Evaluated At: ${summary.evaluatedAt}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase4_orchestrator_input_pass=${pass}`);
console.log(`phase4_orchestrator_input_json=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`phase4_orchestrator_input_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);

if (!pass) {
  process.exitCode = 1;
}
