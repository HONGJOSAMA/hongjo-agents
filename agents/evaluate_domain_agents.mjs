#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { domainRegistry } from "./common/registry.mjs";

const ROOT_DIR = process.cwd();
const schemaPath = path.resolve(ROOT_DIR, "agents/common/output_schema_v1.json");
const baselinePath = path.resolve(ROOT_DIR, "agents/regression_baseline.json");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase3-domain-agent-eval.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase3-domain-agent-eval.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasField(target, fieldPath) {
  return fieldPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target) !== undefined;
}

function validateRequiredFields(target, fields, prefix) {
  return fields.filter((field) => !hasField(target, field)).map((field) => `${prefix}:${field}`);
}

const outputSchema = readJson(schemaPath);
const baseline = readJson(baselinePath);
const results = [];
const failures = [];

for (const entry of domainRegistry) {
  const contract = readJson(entry.contractPath);
  const regression = baseline.domains[entry.domainKey];

  try {
    const result = await entry.runAgent();
    const domainFailures = [];
    domainFailures.push(
      ...validateRequiredFields(result, outputSchema.requiredTopLevel, "top_level"),
      ...validateRequiredFields(result.input || {}, outputSchema.requiredInputFields, "input"),
      ...validateRequiredFields(result.scoring || {}, outputSchema.requiredScoringFields, "scoring"),
      ...validateRequiredFields(result.trace || {}, outputSchema.requiredTraceFields, "trace"),
      ...validateRequiredFields(result.validation || {}, outputSchema.requiredValidationFields, "validation"),
      ...validateRequiredFields(result.hypothesis || {}, outputSchema.requiredHypothesisFields, "hypothesis"),
      ...validateRequiredFields(result.prediction || {}, outputSchema.requiredPredictionFields, "prediction"),
    );

    if (!Array.isArray(result.evidence) || result.evidence.length < contract.output.minimumEvidence) {
      domainFailures.push(`evidence_count:${result.evidence?.length || 0}`);
    } else {
      result.evidence.forEach((item, index) => {
        domainFailures.push(
          ...validateRequiredFields(item, outputSchema.requiredEvidenceFields, `evidence_${index + 1}`),
        );
      });
    }

    if (result.schemaVersion !== contract.outputSchemaVersion) {
      domainFailures.push(`schema_version_mismatch:${result.schemaVersion}`);
    }
    if (result.contractVersion !== contract.contractVersion) {
      domainFailures.push(`contract_version_mismatch:${result.contractVersion}`);
    }
    if (result.status !== "ok") {
      domainFailures.push(`status_invalid:${result.status}`);
    }
    if (!(result.prediction.probability >= 0 && result.prediction.probability <= 1)) {
      domainFailures.push(`prediction_probability_out_of_range:${result.prediction.probability}`);
    }
    if (!(result.prediction.confidence >= 0 && result.prediction.confidence <= 1)) {
      domainFailures.push(`prediction_confidence_out_of_range:${result.prediction.confidence}`);
    }
    if (!outputSchema.riskLevelEnum.includes(result.scoring.riskLevel)) {
      domainFailures.push(`risk_level_invalid:${result.scoring.riskLevel}`);
    }
    if (result.input.filteredRowCount < contract.evaluation.minimumFilteredRows) {
      domainFailures.push(`filtered_rows_below_min:${result.input.filteredRowCount}`);
    }
    if (result.scoring.confidence < contract.evaluation.minimumConfidence) {
      domainFailures.push(`confidence_below_min:${result.scoring.confidence}`);
    }

    for (const ruleId of contract.evaluation.requiredTraceRuleIds) {
      if (!result.trace.selectedRuleIds.includes(ruleId)) {
        domainFailures.push(`trace_rule_missing:${ruleId}`);
      }
    }

    if (regression) {
      if (result.prediction.horizonValue !== regression.horizonValue) {
        domainFailures.push(`horizon_value_regressed:${result.prediction.horizonValue}`);
      }
      if (result.prediction.horizonUnit !== regression.horizonUnit) {
        domainFailures.push(`horizon_unit_regressed:${result.prediction.horizonUnit}`);
      }
      if (result.scoring.signalStrength < regression.minimumSignalStrength) {
        domainFailures.push(`signal_strength_regressed:${result.scoring.signalStrength}`);
      }
      if (result.input.filteredRowCount < regression.minimumFilteredRows) {
        domainFailures.push(`filtered_row_regressed:${result.input.filteredRowCount}`);
      }
      for (const ruleId of regression.requiredRuleIds) {
        if (!result.trace.selectedRuleIds.includes(ruleId)) {
          domainFailures.push(`baseline_rule_missing:${ruleId}`);
        }
      }
    }

    results.push({
      domainKey: entry.domainKey,
      pass: domainFailures.length === 0,
      evidenceCount: result.evidence.length,
      filteredRowCount: result.input.filteredRowCount,
      confidence: result.scoring.confidence,
      signalStrength: result.scoring.signalStrength,
      riskLevel: result.scoring.riskLevel,
      failures: domainFailures,
    });
    failures.push(...domainFailures.map((item) => `${entry.domainKey}:${item}`));
  } catch (error) {
    const message = `agent_eval_failed:${entry.domainKey}:${String(error?.message || error)}`;
    failures.push(message);
    results.push({
      domainKey: entry.domainKey,
      pass: false,
      evidenceCount: 0,
      filteredRowCount: 0,
      confidence: 0,
      signalStrength: 0,
      riskLevel: "low",
      failures: [message],
    });
  }
}

const pass = failures.length === 0;
const summary = {
  pass,
  schemaVersion: outputSchema.schemaVersion,
  contractVersion: outputSchema.contractVersion,
  evaluatedAt: new Date().toISOString(),
  totalAgents: results.length,
  failures,
  results,
};

const md = `# Phase 3 Domain Agent Evaluation

- Status: ${pass ? "pass" : "fail"}
- Schema Version: ${summary.schemaVersion}
- Contract Version: ${summary.contractVersion}
- Total Agents: ${summary.totalAgents}
- Evaluated At: ${summary.evaluatedAt}

## Results
${results
  .map(
    (item) =>
      `- ${item.domainKey}: ${item.pass ? "pass" : "fail"} (filtered=${item.filteredRowCount}, evidence=${item.evidenceCount}, confidence=${item.confidence}, signal=${item.signalStrength})`,
  )
  .join("\n")}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase3_domain_agent_eval_pass=${pass}`);
console.log(`phase3_domain_agent_eval_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);
console.log(`phase3_domain_agent_eval_report_json=${path.relative(ROOT_DIR, reportJsonPath)}`);

if (!pass) {
  process.exitCode = 1;
}
