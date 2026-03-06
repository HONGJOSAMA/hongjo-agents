#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { applyWeightingV1 } from "./weighting/apply_weighting_v1.mjs";
import { generateDissentLogV1 } from "./dissent/generate_dissent_log_v1.mjs";

const ROOT_DIR = process.cwd();
const inputPath = path.resolve(
  ROOT_DIR,
  process.env.ORCHESTRATOR_INPUT || "foundation/evaluation/orchestrator/phase4-orchestrator-input-v1.json",
);
const contractPath = path.resolve(ROOT_DIR, "foundation/orchestrator/output_contract_v1.json");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-orchestrator-run.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-orchestrator-run.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getValue(target, fieldPath) {
  return fieldPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function validateFields(target, fields, prefix) {
  return fields.filter((field) => getValue(target, field) === undefined).map((field) => `${prefix}:${field}`);
}

function determineRiskLevel(probability) {
  if (probability >= 0.67) {
    return "high";
  }
  if (probability >= 0.34) {
    return "medium";
  }
  return "low";
}

function buildFallback(input, weightingResult) {
  const activated = input.domainRuns.length < 3 || weightingResult.averageConfidence < 0.65;
  if (!activated) {
    return {
      activated: false,
      reason: "none",
      mode: "standard",
    };
  }
  return {
    activated: true,
    reason: input.domainRuns.length < 3 ? "insufficient_domain_runs" : "low_confidence",
    mode: "conservative",
  };
}

const input = readJson(inputPath);
const contract = readJson(contractPath);
const weightingResult = applyWeightingV1(input);
const dissentLog = generateDissentLogV1(input, weightingResult);
const fallback = buildFallback(input, weightingResult);
const finalProbability = fallback.activated
  ? Number(((weightingResult.weightedProbability + 0.5) / 2).toFixed(4))
  : weightingResult.weightedProbability;
const finalConfidence = fallback.activated
  ? Number(Math.max(0.5, weightingResult.averageConfidence - 0.1).toFixed(4))
  : weightingResult.averageConfidence;
const finalRiskLevel = determineRiskLevel(finalProbability);

const output = {
  schemaVersion: contract.schemaVersion,
  organizationId: input.organizationId,
  context: input.context,
  strategy: {
    weightingVersion: weightingResult.weightingVersion,
    selectedPolicyRule: weightingResult.selectedPolicyRule,
    weightFactors: weightingResult.weightFactors,
  },
  domainContributions: weightingResult.contributions,
  finalPrediction: {
    probability: finalProbability,
    confidence: finalConfidence,
    riskLevel: finalRiskLevel,
    scenarioLabel: `${finalRiskLevel}_consensus_outlook`,
    summary: `Weighted consensus across ${input.aggregate.domainCount} domain agents indicates a ${finalRiskLevel} outlook.`,
  },
  dissentLog,
  fallback,
};

const failures = [
  ...validateFields(output, contract.requiredTopLevel, "top_level"),
  ...validateFields(output.strategy, contract.requiredStrategyFields, "strategy"),
  ...validateFields(output.finalPrediction, contract.requiredFinalPredictionFields, "final_prediction"),
  ...validateFields(output.fallback, contract.requiredFallbackFields, "fallback"),
];

for (const item of output.domainContributions) {
  failures.push(...validateFields(item, contract.requiredDomainContributionFields, `domain_contribution:${item.domainKey}`));
}

const pass = failures.length === 0;
const summary = {
  pass,
  schemaVersion: output.schemaVersion,
  evaluatedAt: new Date().toISOString(),
  finalPrediction: output.finalPrediction,
  dissentCount: output.dissentLog.length,
  fallback: output.fallback,
  failures,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const md = `# Phase 4 Orchestrator Run

- Status: ${pass ? "pass" : "fail"}
- Schema Version: ${output.schemaVersion}
- Probability: ${output.finalPrediction.probability}
- Confidence: ${output.finalPrediction.confidence}
- Risk Level: ${output.finalPrediction.riskLevel}
- Dissent Count: ${output.dissentLog.length}
- Fallback Activated: ${output.fallback.activated}
- Evaluated At: ${summary.evaluatedAt}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase4_orchestrator_run_pass=${pass}`);
console.log(`phase4_orchestrator_output=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`phase4_orchestrator_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);

if (!pass) {
  process.exitCode = 1;
}
