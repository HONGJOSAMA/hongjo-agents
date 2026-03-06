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
} from "./common.mjs";

const DEFAULT_DOC_DIR = "foundation/data/input/documents";
const mapping = loadConnectorMapping();
const docFields = mapping?.document?.fields || {};

function fileToHypothesis(filePath, index) {
  const stat = fs.statSync(filePath);
  const text = fs.readFileSync(filePath, "utf8");
  const shortText = text.replace(/\s+/g, " ").trim().slice(0, 280);

  return {
    connector: "document",
    entityType: "Hypothesis",
    id: `doc-hyp-${String(index + 1).padStart(4, "0")}`,
    organizationId: getDefaultOrganizationId(),
    domainKey: getDefaultDomainKey(),
    claim: shortText || `document-derived-claim-${index + 1}`,
    assumptions: [`source:${path.basename(filePath)}`],
    createdAt: toIsoTime(stat.mtime.toISOString()),
    confidence: 0.65,
  };
}

function jsonToHypothesis(obj, index) {
  return {
    connector: "document",
    entityType: "Hypothesis",
    id: pickField(obj, docFields.id, `doc-json-hyp-${String(index + 1).padStart(4, "0")}`),
    organizationId: pickField(obj, docFields.organizationId, getDefaultOrganizationId()),
    domainKey: pickField(obj, docFields.domainKey, getDefaultDomainKey()),
    claim: pickField(obj, docFields.claim, `document-json-claim-${index + 1}`),
    assumptions: Array.isArray(pickField(obj, docFields.assumptions, null))
      ? pickField(obj, docFields.assumptions, null)
      : ["document-json-source"],
    createdAt: toIsoTime(pickField(obj, docFields.createdAt, undefined)),
    confidence: typeof pickField(obj, docFields.confidence, null) === "number"
      ? pickField(obj, docFields.confidence, null)
      : 0.65,
  };
}

export function runDocumentConnector() {
  const docDir = path.resolve(process.cwd(), process.env.DOC_INPUT_DIR || DEFAULT_DOC_DIR);
  if (fs.existsSync(docDir)) {
    const files = scanFilesRecursively(docDir, new Set([".txt", ".md", ".json", ".jsonl"]));
    if (files.length > 0) {
      const result = [];
      files.forEach((filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === ".json" || ext === ".jsonl") {
          const text = fs.readFileSync(filePath, "utf8");
          const rows = ext === ".jsonl"
            ? text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
            : JSON.parse(text);
          const arr = Array.isArray(rows) ? rows : [rows];
          arr.forEach((obj) => result.push(jsonToHypothesis(obj, result.length)));
        } else {
          result.push(fileToHypothesis(filePath, result.length));
        }
      });
      return result.slice(0, Number(process.env.DOC_MAX_ROWS || 200));
    }
  }

  const fallbackRows = loadSampleByEntity("Hypothesis", 30);
  return fallbackRows.map((row) => ({ connector: "document", ...row }));
}
