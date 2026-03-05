import fs from "node:fs";
import path from "node:path";

const INPUT = "foundation/tests/schema-validation/phase1-sample-100.jsonl";

export function runApiConnector() {
  const inputPath = path.resolve(process.cwd(), INPUT);
  const lines = fs
    .readFileSync(inputPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.map((line) => JSON.parse(line)).filter((row) => row.entityType === "Observation");
  return rows.slice(0, 40).map((row) => ({ connector: "api", ...row }));
}
