#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const orchestratorOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json");
const calibratedOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-calibrated-output-v1.json");
const contractPath = path.resolve(ROOT_DIR, "foundation/orchestrator/meta_agents/input_contract_v1.json");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-meta-agent-input-v1.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-meta-agent-input-smoke.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-meta-agent-input-smoke.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getValue(target, fieldPath) {
  return fieldPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function validateFields(target, fields, prefix) {
  return fields.filter((field) => getValue(target, field) === undefined).map((field) => `${prefix}:${field}`);
}

const orchestratorOutput = readJson(orchestratorOutputPath);
const calibratedOutput = readJson(calibratedOutputPath);
const contract = readJson(contractPath);
const highestRiskDomain =
  orchestratorOutput.domainContributions
    .slice()
    .sort((left, right) => right.weightedProbability - left.weightedProbability)[0] || null;

const metaInput = {
  schemaVersion: contract.schemaVersion,
  organizationId: orchestratorOutput.organizationId,
  context: {
    trainingSessionId: orchestratorOutput.context.trainingSessionId,
    aarReportId: orchestratorOutput.context.aarReportId,
    selectedPolicyRule: orchestratorOutput.strategy.selectedPolicyRule,
  },
  uncertaintyAgent: {
    finalProbability: orchestratorOutput.finalPrediction.probability,
    finalConfidence: orchestratorOutput.finalPrediction.confidence,
    calibratedProbability: calibratedOutput.calibratedPrediction.probability,
    ece: calibratedOutput.metrics.ece,
    brierScore: calibratedOutput.metrics.brierScore,
    dissentCount: orchestratorOutput.dissentLog.length,
  },
  adversarialAgent: {
    highestRiskDomain: highestRiskDomain?.domainKey || "unknown",
    highestRiskProbability: highestRiskDomain?.weightedProbability || 0,
    topEvidencePack: highestRiskDomain
      ? orchestratorOutput.dissentLog
          .filter((item) => item.domainKey === highestRiskDomain.domainKey)
          .map((item) => item.dissentReason)
      : [],
  },
  policyAgent: {
    actionItemIds: orchestratorOutput.context.actionItemIds,
    fallbackActivated: orchestratorOutput.fallback.activated,
    recommendedMode: orchestratorOutput.fallback.activated ? "human_review" : "standard_monitoring",
  },
};

const failures = [
  ...validateFields(metaInput, contract.requiredTopLevel, "top_level"),
  ...validateFields(metaInput.context, contract.requiredCommonContextFields, "context"),
  ...validateFields(metaInput.uncertaintyAgent, contract.requiredUncertaintyFields, "uncertainty_agent"),
  ...validateFields(metaInput.adversarialAgent, contract.requiredAdversarialFields, "adversarial_agent"),
  ...validateFields(metaInput.policyAgent, contract.requiredPolicyFields, "policy_agent"),
];

const pass = failures.length === 0;
const summary = {
  pass,
  schemaVersion: metaInput.schemaVersion,
  evaluatedAt: new Date().toISOString(),
  failures,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(metaInput, null, 2)}\n`, "utf8");

const md = `# Phase 4 Meta Agent Input Smoke

- Status: ${pass ? "pass" : "fail"}
- Schema Version: ${metaInput.schemaVersion}
- Highest Risk Domain: ${metaInput.adversarialAgent.highestRiskDomain}
- Recommended Mode: ${metaInput.policyAgent.recommendedMode}
- Evaluated At: ${summary.evaluatedAt}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase4_meta_agent_input_pass=${pass}`);
console.log(`phase4_meta_agent_input_output=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`phase4_meta_agent_input_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);

if (!pass) {
  process.exitCode = 1;
}
