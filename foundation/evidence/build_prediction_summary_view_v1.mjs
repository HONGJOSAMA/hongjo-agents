#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const orchestratorOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json");
const calibratedOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-calibrated-output-v1.json");
const metaOutputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-meta-agent-output-v1.json");
const evidencePackPath = path.resolve(ROOT_DIR, "foundation/evaluation/evidence/phase5-evidence-pack-v1.json");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/evidence/phase5-prediction-summary-view-v1.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const orchestratorOutput = readJson(orchestratorOutputPath);
const calibratedOutput = readJson(calibratedOutputPath);
const metaOutput = readJson(metaOutputPath);
const evidencePack = readJson(evidencePackPath);

const summaryView = {
  schemaVersion: "phase5-prediction-summary-view/v1",
  organizationId: orchestratorOutput.organizationId,
  trainingSessionId: orchestratorOutput.context.trainingSessionId,
  aarReportId: orchestratorOutput.context.aarReportId,
  finalPrediction: orchestratorOutput.finalPrediction,
  calibration: calibratedOutput.metrics,
  meta: {
    uncertaintySeverity: metaOutput.uncertainty.severity,
    adversarialTarget: metaOutput.adversarial.targetDomain,
    policyActionPriority: metaOutput.policy.actionPriority,
  },
  evidencePreview: evidencePack.items.slice(0, 5),
  dissentPreview: evidencePack.dissentHighlights.slice(0, 3),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summaryView, null, 2)}\n`, "utf8");

console.log(`phase5_prediction_summary_view=${path.relative(ROOT_DIR, outputPath)}`);
