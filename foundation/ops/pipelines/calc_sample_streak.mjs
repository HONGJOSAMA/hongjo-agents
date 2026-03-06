#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const token = process.env.GITHUB_TOKEN || "";
const repository = process.env.GITHUB_REPOSITORY || "";
const workflowFile = process.env.READINESS_WORKFLOW_FILE || "phase2-sample-readiness.yml";
const includeCurrent = process.env.INCLUDE_CURRENT_SUCCESS === "1";
const targetStreak = Number(process.env.SAMPLE_STREAK_TARGET || 3);

let streak = includeCurrent ? 1 : 0;
let source = "local-fallback";

if (token && repository.includes("/")) {
  try {
    const [owner, repo] = repository.split("/");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?branch=main&status=completed&per_page=30`;
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "phase2-sample-readiness",
      },
    });

    if (res.ok) {
      const body = await res.json();
      const runs = Array.isArray(body.workflow_runs) ? body.workflow_runs : [];
      streak = 0;
      for (const run of runs) {
        if (run.conclusion === "success") {
          streak += 1;
        } else {
          break;
        }
      }
      if (includeCurrent) {
        streak += 1;
      }
      source = "github-api";
    } else {
      console.log(`sample_streak_warning=github_api_status_${res.status}`);
    }
  } catch {
    console.log("sample_streak_warning=github_api_unreachable");
  }
} else {
  console.log("sample_streak_warning=missing_github_token_or_repository");
}

const ready = streak >= targetStreak;
const reportPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/sample-mode-readiness.md",
);
const jsonPath = path.resolve(
  process.cwd(),
  "foundation/evaluation/metrics/sample-mode-readiness.json",
);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const markdown = `# Sample Mode Readiness

- Workflow: \`${workflowFile}\`
- Source: \`${source}\`
- Target Streak: ${targetStreak}
- Current Consecutive Success: ${streak}
- Ready For Live Shadow Mode: ${ready ? "yes" : "no"}
- Evaluated At: ${new Date().toISOString()}
`;

fs.writeFileSync(reportPath, markdown, "utf8");
fs.writeFileSync(
  jsonPath,
  `${JSON.stringify(
    {
      workflow: workflowFile,
      source,
      targetStreak,
      streak,
      ready,
      evaluatedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`sample_streak=${streak}`);
console.log(`sample_target=${targetStreak}`);
console.log(`sample_ready=${ready}`);
console.log(`sample_report=foundation/evaluation/metrics/sample-mode-readiness.md`);
console.log(`sample_report_json=foundation/evaluation/metrics/sample-mode-readiness.json`);
