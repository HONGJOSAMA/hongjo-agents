#!/usr/bin/env node

import { runDomainAgent, writeAgentOutput } from "../common/base_agent.mjs";

export async function runAgent() {
  const result = await runDomainAgent({
    agentId: "macroeconomy-agent-v1",
    displayName: "Macroeconomy Agent",
    domainKey: "macroeconomy",
    horizonValue: 30,
    horizonUnit: "day",
    modelVersion: "phase3-domain-v1",
    promptHash: "macroeconomy-phase3-v1",
    claimTemplate: "Macroeconomic signals imply short-horizon pressure on operating conditions.",
    rules: [
      "prioritize rate/inflation/growth signals",
      "treat low-confidence signals as supporting only",
      "return at least 3 evidence records",
    ],
  });
  result.outputPath = writeAgentOutput(result);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runAgent();
  console.log(JSON.stringify(result, null, 2));
}
