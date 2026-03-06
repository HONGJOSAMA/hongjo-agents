#!/usr/bin/env node

import { runDomainAgent, writeAgentOutput } from "../common/base_agent.mjs";

export async function runAgent() {
  const result = await runDomainAgent({
    schemaVersion: "phase3-domain-agent-output/v1",
    contractVersion: "1.0.0",
    agentId: "supply-chain-trade-agent-v1",
    displayName: "Supply Chain & Trade Agent",
    domainKey: "supply_chain_trade",
    requiredFields: ["organizationId", "domainKey", "eventTime", "raw.id", "quality.confidence"],
    minimumEvidence: 3,
    focusRuleId: "supply_chain_trade_focus",
    inputFilter: {
      entityTypes: ["Observation", "Prediction"],
      preferredSourceTypes: ["document", "csv", "api"],
      preferredSignalTypes: ["event_signal", "rate_signal"],
      minimumConfidence: 0.7,
      selectionLimit: 5,
    },
    horizonValue: 21,
    horizonUnit: "day",
    modelVersion: "phase3-domain-v1",
    promptHash: "supply-chain-trade-phase3-v1",
    claimTemplate: "Trade and logistics signals imply near-term movement in supply reliability.",
    rules: [
      "prioritize logistics and trade friction signals",
      "prefer source recency when evidence counts tie",
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
