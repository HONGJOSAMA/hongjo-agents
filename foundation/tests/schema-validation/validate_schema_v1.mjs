#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      parsed[key] = argv[i + 1];
      i += 1;
    }
  }
  return parsed;
}

function parseSchema(schemaText) {
  const lines = schemaText.split(/\r?\n/);
  const requiredByEntity = {};
  const crossDomainKeys = [];

  let inEntities = false;
  let currentEntity = null;
  let inRequired = false;
  let inCrossDomains = false;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "    ");
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (/^entities:\s*$/.test(trimmed)) {
      inEntities = true;
      inCrossDomains = false;
      currentEntity = null;
      inRequired = false;
      continue;
    }

    if (/^crossDomainKeys:\s*$/.test(trimmed)) {
      inCrossDomains = true;
      inEntities = false;
      currentEntity = null;
      inRequired = false;
      continue;
    }

    if (inCrossDomains) {
      const m = line.match(/^\s{2}-\s+([a-z0-9_]+)\s*$/);
      if (m) {
        crossDomainKeys.push(m[1]);
      }
      continue;
    }

    if (!inEntities) {
      continue;
    }

    const entityMatch = line.match(/^\s{2}([A-Za-z][A-Za-z0-9_]*):\s*$/);
    if (entityMatch) {
      currentEntity = entityMatch[1];
      requiredByEntity[currentEntity] = [];
      inRequired = false;
      continue;
    }

    if (!currentEntity) {
      continue;
    }

    if (/^\s{4}required:\s*$/.test(line)) {
      inRequired = true;
      continue;
    }

    if (/^\s{4}[a-zA-Z]+:\s*$/.test(line) && !/^\s{4}required:\s*$/.test(line)) {
      inRequired = false;
      continue;
    }

    if (inRequired) {
      const reqMatch = line.match(/^\s{6}-\s+([A-Za-z][A-Za-z0-9_]*)\s*$/);
      if (reqMatch) {
        requiredByEntity[currentEntity].push(reqMatch[1]);
      }
    }
  }

  return { requiredByEntity, crossDomainKeys };
}

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function validateRecords(records, requiredByEntity, crossDomainKeys) {
  const errors = [];
  const missingCounts = {};
  const domainSeen = new Set();
  const entityCount = {};

  const predictions = new Map();
  const evidenceByPrediction = new Map();

  let validCount = 0;
  let requiredChecks = 0;
  let requiredMissing = 0;

  function addError(index, entityType, message) {
    errors.push(`line ${index + 1} [${entityType}] ${message}`);
  }

  records.forEach((record, index) => {
    const entityType = record.entityType;
    entityCount[entityType] = (entityCount[entityType] || 0) + 1;

    const requiredFields = requiredByEntity[entityType];
    if (!requiredFields) {
      addError(index, entityType, "unknown entityType");
      return;
    }

    let localValid = true;

    for (const field of requiredFields) {
      requiredChecks += 1;
      if (isMissing(record[field])) {
        localValid = false;
        requiredMissing += 1;
        missingCounts[field] = (missingCounts[field] || 0) + 1;
        addError(index, entityType, `missing required field: ${field}`);
      }
    }

    if (record.domainKey) {
      domainSeen.add(record.domainKey);
      if (!crossDomainKeys.includes(record.domainKey)) {
        localValid = false;
        addError(index, entityType, `invalid domainKey: ${record.domainKey}`);
      }
    }

    if (record.probability !== undefined) {
      if (typeof record.probability !== "number" || record.probability < 0 || record.probability > 1) {
        localValid = false;
        addError(index, entityType, "probability out of range (0..1)");
      }
    }

    if (record.confidence !== undefined && record.confidence !== null) {
      if (typeof record.confidence !== "number" || record.confidence < 0 || record.confidence > 1) {
        localValid = false;
        addError(index, entityType, "confidence out of range (0..1)");
      }
    }

    if (record.trustScore !== undefined) {
      if (typeof record.trustScore !== "number" || record.trustScore < 0 || record.trustScore > 1) {
        localValid = false;
        addError(index, entityType, "trustScore out of range (0..1)");
      }
    }

    if (entityType === "Prediction") {
      predictions.set(record.id, record.organizationId);
    }

    if (entityType === "Evidence") {
      const count = evidenceByPrediction.get(record.predictionId) || 0;
      evidenceByPrediction.set(record.predictionId, count + 1);

      const predictionOrg = predictions.get(record.predictionId);
      if (predictionOrg && predictionOrg !== record.organizationId) {
        localValid = false;
        addError(index, entityType, "organizationId mismatch with prediction");
      }
    }

    if ((entityType === "Dissent" || entityType === "Outcome") && record.predictionId) {
      const predictionOrg = predictions.get(record.predictionId);
      if (predictionOrg && predictionOrg !== record.organizationId) {
        localValid = false;
        addError(index, entityType, "organizationId mismatch with prediction");
      }
    }

    if (localValid) {
      validCount += 1;
    }
  });

  for (const [predictionId] of predictions) {
    const evidenceCount = evidenceByPrediction.get(predictionId) || 0;
    if (evidenceCount < 1) {
      errors.push(`prediction ${predictionId} has no evidence`);
    }
  }

  const totalCount = records.length;
  const passRate = totalCount === 0 ? 0 : Number(((validCount / totalCount) * 100).toFixed(2));
  const requiredMissingRate = requiredChecks === 0
    ? 0
    : Number(((requiredMissing / requiredChecks) * 100).toFixed(2));
  const missingDomainKeys = crossDomainKeys.filter((key) => !domainSeen.has(key));

  return {
    totalCount,
    validCount,
    passRate,
    requiredChecks,
    requiredMissing,
    requiredMissingRate,
    errors,
    missingCounts,
    entityCount,
    domainSeen: [...domainSeen],
    missingDomainKeys,
  };
}

function toMarkdownReport(summary, sourcePath) {
  const lines = [];
  lines.push("# Schema Validation Report (Phase 1)");
  lines.push("");
  lines.push(`- Source: \`${sourcePath}\``);
  lines.push(`- Total Records: ${summary.totalCount}`);
  lines.push(`- Valid Records: ${summary.validCount}`);
  lines.push(`- Validation Pass Rate: ${summary.passRate}%`);
  lines.push(`- Required Field Missing Rate: ${summary.requiredMissingRate}%`);
  lines.push("");
  lines.push("## Domain Coverage");
  lines.push(`- Seen: ${summary.domainSeen.join(", ") || "-"}`);
  lines.push(`- Missing: ${summary.missingDomainKeys.join(", ") || "-"}`);
  lines.push("");
  lines.push("## Entity Distribution");
  for (const [entity, count] of Object.entries(summary.entityCount)) {
    lines.push(`- ${entity}: ${count}`);
  }
  lines.push("");
  lines.push("## Error Summary");
  lines.push(`- Error Count: ${summary.errors.length}`);
  if (summary.errors.length > 0) {
    lines.push("- First 10 Errors:");
    summary.errors.slice(0, 10).forEach((err) => lines.push(`  - ${err}`));
  } else {
    lines.push("- None");
  }
  lines.push("");
  lines.push("## Required Field Missing Counts");
  const missingEntries = Object.entries(summary.missingCounts);
  if (missingEntries.length === 0) {
    lines.push("- None");
  } else {
    missingEntries.forEach(([field, count]) => lines.push(`- ${field}: ${count}`));
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const args = parseArgs(process.argv.slice(2));

const schemaPath = path.resolve(
  process.cwd(),
  args.schema || "foundation/ontology/domain_schema/v1/domain_schema_v1.yaml",
);
const inputPath = path.resolve(
  process.cwd(),
  args.input || "foundation/tests/schema-validation/phase1-sample-100.jsonl",
);
const reportPath = path.resolve(
  process.cwd(),
  args.report || "foundation/evaluation/metrics/schema-validation-phase1.md",
);

const schemaText = fs.readFileSync(schemaPath, "utf8");
const { requiredByEntity, crossDomainKeys } = parseSchema(schemaText);

const rawRows = fs
  .readFileSync(inputPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const records = rawRows.map((line, index) => {
  try {
    return JSON.parse(line);
  } catch {
    throw new Error(`invalid JSON at line ${index + 1}`);
  }
});

const summary = validateRecords(records, requiredByEntity, crossDomainKeys);
const sourcePathForReport = path.relative(process.cwd(), inputPath) || inputPath;
const reportPathForOutput = path.relative(process.cwd(), reportPath) || reportPath;
const markdown = toMarkdownReport(summary, sourcePathForReport);

fs.writeFileSync(reportPath, markdown, "utf8");

console.log(`total=${summary.totalCount}`);
console.log(`valid=${summary.validCount}`);
console.log(`pass_rate=${summary.passRate}%`);
console.log(`required_missing_rate=${summary.requiredMissingRate}%`);
console.log(`error_count=${summary.errors.length}`);
console.log(`report=${reportPathForOutput}`);

if (summary.totalCount < 100 || summary.passRate < 98 || summary.missingDomainKeys.length > 0) {
  process.exitCode = 1;
}
