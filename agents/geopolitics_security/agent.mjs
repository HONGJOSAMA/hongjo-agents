#!/usr/bin/env node

import { runDomainAgent, writeAgentOutput } from "../common/base_agent.mjs";

export async function runAgent() {
  const result = await runDomainAgent({
    agentId: "geopolitics-security-agent-v1",
    displayName: "Geopolitics & Security Agent",
    domainKey: "geopolitics_security",
    horizonValue: 21,
    horizonUnit: "day",
    modelVersion: "phase3-domain-v1",
    promptHash: "geopolitics-security-phase3-v1",
    claimTemplate: "Geopolitical and security signals indicate elevated near-term disruption risk.",
    rules: [
      "prioritize escalation and posture-change signals",
      "treat conflicting low-trust signals as cautionary evidence",
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
