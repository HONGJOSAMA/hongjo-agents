#!/usr/bin/env node

import { runDomainAgent, writeAgentOutput } from "../common/base_agent.mjs";

export async function runAgent() {
  const result = await runDomainAgent({
    agentId: "policy-politics-agent-v1",
    displayName: "Policy & Politics Agent",
    domainKey: "policy_politics",
    horizonValue: 14,
    horizonUnit: "day",
    modelVersion: "phase3-domain-v1",
    promptHash: "policy-politics-phase3-v1",
    claimTemplate: "Policy and political signals point to short-cycle rule or sentiment shifts.",
    rules: [
      "prioritize rule/policy/regulatory signals",
      "surface policy timing risk before confidence uplift",
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
