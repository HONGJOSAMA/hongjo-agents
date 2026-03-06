import fs from "node:fs";
import path from "node:path";
import {
  getDefaultDomainKey,
  getDefaultOrganizationId,
  loadConnectorMapping,
  loadSampleByEntity,
  pickField,
  scanFilesRecursively,
  toIsoTime,
  toNumberOrNull,
} from "./common.mjs";

const DEFAULT_CSV_DIR = "foundation/data/input/csv";
const mapping = loadConnectorMapping();
const csvFields = mapping?.csv?.fields || {};

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quote = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (quote && line[i + 1] === "\"") {
        cur += "\"";
        i += 1;
      } else {
        quote = !quote;
      }
    } else if (ch === "," && !quote) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function csvRowToPrediction(row, index) {
  const organizationId = pickField(row, csvFields.organizationId, getDefaultOrganizationId());
  const domainKey = pickField(row, csvFields.domainKey, getDefaultDomainKey());

  return {
    connector: "csv",
    entityType: "Prediction",
    id: pickField(row, csvFields.id, `csv-pred-${String(index + 1).padStart(4, "0")}`),
    organizationId,
    runKey: pickField(row, csvFields.runKey, `csv-run-${String(index + 1).padStart(4, "0")}`),
    domainKey,
    horizonValue: Number(pickField(row, csvFields.horizonValue, 7)),
    horizonUnit: pickField(row, csvFields.horizonUnit, "DAY"),
    probability: toNumberOrNull(pickField(row, csvFields.probability, 0.5), 0.5),
    modelVersion: pickField(row, csvFields.modelVersion, "v1.0.0"),
    promptHash: pickField(row, csvFields.promptHash, `csv-hash-${String(index + 1).padStart(4, "0")}`),
    createdAt: toIsoTime(pickField(row, csvFields.createdAt, row.observedAt)),
    confidence: toNumberOrNull(pickField(row, csvFields.confidence, 0.7), 0.7),
  };
}

function parseCsvFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export function runCsvConnector() {
  const csvDir = path.resolve(process.cwd(), process.env.CSV_INPUT_DIR || DEFAULT_CSV_DIR);
  if (fs.existsSync(csvDir)) {
    const files = scanFilesRecursively(csvDir, new Set([".csv"]));
    if (files.length > 0) {
      const result = [];
      files.forEach((filePath) => {
        const rows = parseCsvFile(filePath);
        rows.forEach((row) => result.push(csvRowToPrediction(row, result.length)));
      });
      return result.slice(0, Number(process.env.CSV_MAX_ROWS || 500));
    }
  }

  const fallbackRows = loadSampleByEntity("Prediction", 30);
  return fallbackRows.map((row) => ({ connector: "csv", ...row }));
}
