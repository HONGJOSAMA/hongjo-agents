#!/usr/bin/env node

import { runDomainAgent, writeAgentOutput } from "../common/base_agent.mjs";

export async function runAgent() {
  const result = await runDomainAgent({
    schemaVersion: "phase3-domain-agent-output/v1",
    contractVersion: "1.0.0",
    agentId: "cyber-information-agent-v1",
    displayName: "Cyber & Information Agent",
    domainKey: "cyber_information",
    requiredFields: ["organizationId", "domainKey", "eventTime", "raw.id", "quality.confidence"],
    minimumEvidence: 3,
    focusRuleId: "cyber_information_focus",
    inputFilter: {
      entityTypes: ["Observation", "Prediction"],
      preferredSourceTypes: ["api", "csv"],
      preferredSignalTypes: ["rate_signal", "event_signal"],
      minimumConfidence: 0.7,
      selectionLimit: 5,
    },
    horizonValue: 7,
    horizonUnit: "day",
    modelVersion: "phase3-domain-v1",
    promptHash: "cyber-information-phase3-v1",
    claimTemplate: "Cyber and information-domain signals suggest short-horizon signal integrity risk.",
    rules: [
      "prioritize cyber/information integrity observations",
      "bias toward recent confidence-weighted signals",
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
