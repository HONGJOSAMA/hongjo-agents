#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { runApiConnector } from "./connectors/api_connector.mjs";
import { runDocumentConnector } from "./connectors/document_connector.mjs";
import { runCsvConnector } from "./connectors/csv_connector.mjs";
const normalizedPath = path.resolve(
  process.cwd(),
  "foundation/data/normalized/phase2-normalized-sample.jsonl",
);
const rawApiPath = path.resolve(process.cwd(), "foundation/data/raw/api/phase2-api-sample.jsonl");
const rawDocPath = path.resolve(process.cwd(), "foundation/data/raw/documents/phase2-doc-sample.jsonl");
const rawCsvPath = path.resolve(process.cwd(), "foundation/data/raw/csv/phase2-csv-sample.jsonl");
const reportPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/data_quality_report.md",
);

function safeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function normalizeRecord(record) {
  return {
    entityType: record.entityType ?? null,
    organizationId: record.organizationId ?? null,
    domainKey: record.domainKey ?? null,
    eventTime: record.observedAt ?? record.createdAt ?? null,
    quality: {
      confidence: safeNumber(record.confidence),
      trustScore: safeNumber(record.trustScore),
      piiFlag: Boolean(record.piiFlag),
    },
    raw: record,
  };
}

function buildQualityReport(records) {
  const total = records.length;
  let missingCritical = 0;
  let duplicateIds = 0;
  let piiFlagged = 0;
  const idSeen = new Set();

  for (const row of records) {
    const requiresDomain = ["Observation", "Hypothesis", "Prediction", "Dissent"].includes(
      row.entityType || "",
    );
    const criticalMissing =
      !row.entityType ||
      !row.organizationId ||
      (requiresDomain && !row.domainKey);
    if (criticalMissing) {
      missingCritical += 1;
    }

    const id = row.raw?.id;
    if (id) {
      if (idSeen.has(id)) {
        duplicateIds += 1;
      }
      idSeen.add(id);
    }

    if (row.quality.piiFlag) {
      piiFlagged += 1;
    }
  }

  const missingRate = total === 0 ? 0 : Number(((missingCritical / total) * 100).toFixed(2));
  const duplicateRate = total === 0 ? 0 : Number(((duplicateIds / total) * 100).toFixed(2));
  const piiRate = total === 0 ? 0 : Number(((piiFlagged / total) * 100).toFixed(2));
  const ingestSuccessRate = total === 0 ? 0 : Number((((total - missingCritical) / total) * 100).toFixed(2));

  return {
    total,
    missingCritical,
    duplicateIds,
    piiFlagged,
    missingRate,
    duplicateRate,
    piiRate,
    ingestSuccessRate,
  };
}

function toReportMarkdown(summary) {
  return `# Data Quality Report (Phase 2 Draft)

- Source:
  - \`foundation/data/raw/api/phase2-api-sample.jsonl\`
  - \`foundation/data/raw/documents/phase2-doc-sample.jsonl\`
  - \`foundation/data/raw/csv/phase2-csv-sample.jsonl\`
- Normalized Output: \`foundation/data/normalized/phase2-normalized-sample.jsonl\`
- Total Records: ${summary.total}

## Quality Metrics
- Ingest Success Rate: ${summary.ingestSuccessRate}%
- Missing Critical Fields: ${summary.missingCritical} (${summary.missingRate}%)
- Duplicate IDs: ${summary.duplicateIds} (${summary.duplicateRate}%)
- PII Flagged Rows: ${summary.piiFlagged} (${summary.piiRate}%)

## Threshold Check (Phase 2 target)
- ingest success >= 95%: ${summary.ingestSuccessRate >= 95 ? "pass" : "fail"}
- missing rate <= 5%: ${summary.missingRate <= 5 ? "pass" : "fail"}
- duplicate rate <= 2%: ${summary.duplicateRate <= 2 ? "pass" : "fail"}
`;
}

const apiRows = runApiConnector();
const docRows = runDocumentConnector();
const csvRows = runCsvConnector();
const sourceRecords = [...apiRows, ...docRows, ...csvRows];

const normalizedRecords = sourceRecords.map(normalizeRecord);
const summary = buildQualityReport(normalizedRecords);

fs.mkdirSync(path.dirname(normalizedPath), { recursive: true });
fs.mkdirSync(path.dirname(rawApiPath), { recursive: true });
fs.mkdirSync(path.dirname(rawDocPath), { recursive: true });
fs.mkdirSync(path.dirname(rawCsvPath), { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

fs.writeFileSync(rawApiPath, `${apiRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
fs.writeFileSync(rawDocPath, `${docRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
fs.writeFileSync(rawCsvPath, `${csvRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
const normalizedBody = `${normalizedRecords.map((row) => JSON.stringify(row)).join("\n")}\n`;
fs.writeFileSync(normalizedPath, normalizedBody, "utf8");
fs.writeFileSync(reportPath, toReportMarkdown(summary), "utf8");

console.log(`normalized_records=${normalizedRecords.length}`);
console.log(`raw_api_records=${apiRows.length}`);
console.log(`raw_document_records=${docRows.length}`);
console.log(`raw_csv_records=${csvRows.length}`);
console.log(`ingest_success_rate=${summary.ingestSuccessRate}%`);
console.log(`missing_rate=${summary.missingRate}%`);
console.log(`duplicate_rate=${summary.duplicateRate}%`);
console.log(`report=foundation/evaluation/metrics/data_quality_report.md`);
