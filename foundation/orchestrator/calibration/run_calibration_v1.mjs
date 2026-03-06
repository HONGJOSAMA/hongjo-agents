#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const orchestratorOutputPath = path.resolve(
  ROOT_DIR,
  "foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json",
);
const referencePath = path.resolve(ROOT_DIR, "foundation/orchestrator/calibration/reference_outcomes_v1.json");
const outputPath = path.resolve(ROOT_DIR, "foundation/evaluation/orchestrator/phase4-calibrated-output-v1.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-calibration-report.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase4-calibration-report.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mean(values) {
  return values.reduce((acc, value) => acc + value, 0) / Math.max(values.length, 1);
}

function computeBrier(samples) {
  return Number(mean(samples.map((item) => (item.probability - item.outcome) ** 2)).toFixed(4));
}

function computeEce(samples, binCount = 5) {
  const bins = Array.from({ length: binCount }, (_, index) => ({
    min: index / binCount,
    max: (index + 1) / binCount,
    items: [],
  }));

  for (const sample of samples) {
    const index = Math.min(binCount - 1, Math.floor(sample.probability * binCount));
    bins[index].items.push(sample);
  }

  const total = samples.length || 1;
  const ece = bins.reduce((acc, bin) => {
    if (bin.items.length === 0) {
      return acc;
    }
    const avgProbability = mean(bin.items.map((item) => item.probability));
    const avgOutcome = mean(bin.items.map((item) => item.outcome));
    return acc + (bin.items.length / total) * Math.abs(avgProbability - avgOutcome);
  }, 0);

  return Number(ece.toFixed(4));
}

const orchestratorOutput = readJson(orchestratorOutputPath);
const reference = readJson(referencePath);
const samples = orchestratorOutput.domainContributions.map((item) => ({
  domainKey: item.domainKey,
  probability: item.baseProbability,
  outcome: reference.domainOutcomes[item.domainKey] ?? 0,
}));

const brierScore = computeBrier(samples);
const ece = computeEce(samples);
const calibrationFactor = ece > 0.1 ? 0.85 : 0.93;
const calibratedProbability = Number(
  (0.5 + (orchestratorOutput.finalPrediction.probability - 0.5) * calibrationFactor).toFixed(4),
);
const confidenceCap = ece > 0.1 ? 0.78 : 0.88;
const calibratedConfidence = Number(
  Math.min(orchestratorOutput.finalPrediction.confidence, confidenceCap).toFixed(4),
);

const calibratedOutput = {
  schemaVersion: "phase4-calibrated-output/v1",
  calibrationVersion: "phase4-calibration-v1",
  sourceOutputPath: path.relative(ROOT_DIR, orchestratorOutputPath),
  metrics: {
    brierScore,
    ece,
    calibrationFactor,
    confidenceCap,
  },
  calibratedPrediction: {
    probability: calibratedProbability,
    confidence: calibratedConfidence,
    riskLevel: orchestratorOutput.finalPrediction.riskLevel,
    scenarioLabel: orchestratorOutput.finalPrediction.scenarioLabel,
  },
  sampleCount: samples.length,
  evaluatedAt: new Date().toISOString(),
};

const pass = brierScore <= 0.3 && ece <= 0.15;
const summary = {
  pass,
  ...calibratedOutput,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(calibratedOutput, null, 2)}\n`, "utf8");

const md = `# Phase 4 Calibration Report

- Status: ${pass ? "pass" : "fail"}
- Calibration Version: ${calibratedOutput.calibrationVersion}
- Brier Score: ${brierScore}
- ECE: ${ece}
- Calibrated Probability: ${calibratedProbability}
- Calibrated Confidence: ${calibratedConfidence}
- Evaluated At: ${calibratedOutput.evaluatedAt}
`;

fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase4_calibration_pass=${pass}`);
console.log(`phase4_calibration_output=${path.relative(ROOT_DIR, outputPath)}`);
console.log(`phase4_calibration_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);

if (!pass) {
  process.exitCode = 1;
}
