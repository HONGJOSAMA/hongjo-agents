import fs from "node:fs";
import path from "node:path";
import { getDefaultDomainKey, getDefaultOrganizationId, loadSampleByEntity, scanFilesRecursively, toIsoTime, toNumberOrNull } from "./common.mjs";

const DEFAULT_CSV_DIR = "foundation/data/input/csv";

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
  const organizationId = row.organizationId || getDefaultOrganizationId();
  const domainKey = row.domainKey || getDefaultDomainKey();

  return {
    connector: "csv",
    entityType: "Prediction",
    id: row.id || `csv-pred-${String(index + 1).padStart(4, "0")}`,
    organizationId,
    runKey: row.runKey || `csv-run-${String(index + 1).padStart(4, "0")}`,
    domainKey,
    horizonValue: Number(row.horizonValue || 7),
    horizonUnit: row.horizonUnit || "DAY",
    probability: toNumberOrNull(row.probability, 0.5),
    modelVersion: row.modelVersion || "v1.0.0",
    promptHash: row.promptHash || `csv-hash-${String(index + 1).padStart(4, "0")}`,
    createdAt: toIsoTime(row.createdAt || row.observedAt),
    confidence: toNumberOrNull(row.confidence, 0.7),
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
