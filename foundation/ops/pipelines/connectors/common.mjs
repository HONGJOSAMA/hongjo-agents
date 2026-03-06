import fs from "node:fs";
import path from "node:path";

const SAMPLE_INPUT = "foundation/tests/schema-validation/phase1-sample-100.jsonl";

export function getDefaultOrganizationId() {
  return process.env.PIPELINE_ORGANIZATION_ID || "org-demo-001";
}

export function getDefaultDomainKey() {
  return process.env.PIPELINE_DEFAULT_DOMAIN_KEY || "cyber_information";
}

export function toIsoTime(value) {
  if (!value) {
    return new Date().toISOString();
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  return d.toISOString();
}

export function toNumberOrNull(value, fallback = null) {
  const n = Number(value);
  if (Number.isFinite(n)) {
    return n;
  }
  return fallback;
}

export function loadSampleByEntity(entityType, limit = 20) {
  const inputPath = path.resolve(process.cwd(), SAMPLE_INPUT);
  if (!fs.existsSync(inputPath)) {
    return [];
  }

  const lines = fs
    .readFileSync(inputPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines
    .map((line) => JSON.parse(line))
    .filter((row) => row.entityType === entityType)
    .slice(0, limit);

  return rows;
}

export function scanFilesRecursively(baseDir, allowedExtensions) {
  const entries = [];
  const stack = [baseDir];

  while (stack.length > 0) {
    const dir = stack.pop();
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      const ext = path.extname(item.name).toLowerCase();
      if (allowedExtensions.has(ext)) {
        entries.push(fullPath);
      }
    }
  }

  return entries.sort();
}

