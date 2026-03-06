#!/usr/bin/env node

import { runDomainAgent, writeAgentOutput } from "../common/base_agent.mjs";

export async function runAgent() {
  const result = await runDomainAgent({
    schemaVersion: "phase3-domain-agent-output/v1",
    contractVersion: "1.0.0",
    agentId: "policy-politics-agent-v1",
    displayName: "Policy & Politics Agent",
    domainKey: "policy_politics",
    requiredFields: ["organizationId", "domainKey", "eventTime", "raw.id", "quality.confidence"],
    minimumEvidence: 3,
    focusRuleId: "policy_politics_focus",
    inputFilter: {
      entityTypes: ["Observation", "Prediction"],
      preferredSourceTypes: ["document", "api", "csv"],
      preferredSignalTypes: ["event_signal"],
      minimumConfidence: 0.7,
      selectionLimit: 5,
    },
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
