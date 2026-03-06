#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { domainRegistry } from "./common/registry.mjs";

const ROOT_DIR = process.cwd();
const contextPath = path.resolve(ROOT_DIR, "foundation/data/specialforce/specialforce-context-sample.json");
const normalizedPath = path.resolve(ROOT_DIR, "foundation/data/normalized/phase3-specialforce-adapter.jsonl");
const outputDir = path.resolve(ROOT_DIR, "foundation/evaluation/agents/specialforce_context");
const reportMdPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase3-specialforce-adapter-smoke.md");
const reportJsonPath = path.resolve(ROOT_DIR, "foundation/evaluation/metrics/phase3-specialforce-adapter-smoke.json");

execFileSync("node", ["agents/adapters/generate_specialforce_context_sample.mjs"], {
  cwd: ROOT_DIR,
  stdio: "inherit",
});

execFileSync("node", ["agents/adapters/adapt_specialforce_context_to_normalized.mjs"], {
  cwd: ROOT_DIR,
  stdio: "inherit",
});

const results = [];
const failures = [];
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of domainRegistry) {
  try {
    const env = {
      ...process.env,
      DOMAIN_AGENT_INPUT: path.relative(ROOT_DIR, normalizedPath),
      DOMAIN_AGENT_OUTPUT_DIR: path.relative(ROOT_DIR, outputDir),
    };
    execFileSync("node", ["agents/run_domain_agent.mjs", entry.domainKey], {
      cwd: ROOT_DIR,
      env,
      stdio: "ignore",
    });
    const outputPath = path.resolve(outputDir, `${entry.domainKey}-agent-output.json`);
    const result = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    results.push({
      domainKey: entry.domainKey,
      pass: Boolean(result?.prediction && result?.hypothesis && (result?.evidence?.length ?? 0) >= 3),
      outputPath: path.relative(ROOT_DIR, outputPath),
      trainingSessionId: result.input.selectedObservationIds.length > 0 ? "session-01" : null,
      aarReportId: "aar-01",
    });
  } catch (error) {
    const message = `specialforce_context_agent_failed:${entry.domainKey}:${String(error?.message || error)}`;
    failures.push(message);
    results.push({
      domainKey: entry.domainKey,
      pass: false,
      outputPath: null,
      trainingSessionId: "session-01",
      aarReportId: "aar-01",
    });
  }
}

const pass = failures.length === 0;
const summary = {
  pass,
  contextPath: path.relative(ROOT_DIR, contextPath),
  normalizedPath: path.relative(ROOT_DIR, normalizedPath),
  outputDir: path.relative(ROOT_DIR, outputDir),
  evaluatedAt: new Date().toISOString(),
  results,
  failures,
};

const md = `# Phase 3 Specialforce Context Adapter Smoke

- Status: ${pass ? "pass" : "fail"}
- Context: ${summary.contextPath}
- Adapted Normalized: ${summary.normalizedPath}
- Output Dir: ${summary.outputDir}
- Evaluated At: ${summary.evaluatedAt}

## Results
${results.map((item) => `- ${item.domainKey}: ${item.pass ? "pass" : "fail"} (${item.outputPath || "no-output"})`).join("\n")}

## Failures
${failures.length === 0 ? "- none" : failures.map((item) => `- ${item}`).join("\n")}
`;

fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
fs.writeFileSync(reportMdPath, md, "utf8");
fs.writeFileSync(reportJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(`phase3_specialforce_adapter_pass=${pass}`);
console.log(`phase3_specialforce_adapter_report_md=${path.relative(ROOT_DIR, reportMdPath)}`);
console.log(`phase3_specialforce_adapter_report_json=${path.relative(ROOT_DIR, reportJsonPath)}`);

if (!pass) {
  process.exitCode = 1;
}
