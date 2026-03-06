#!/usr/bin/env node

export function runUncertaintyAgentV1(input) {
  const uncertaintyScore = Number(
    Math.min(
      1,
      0.5 * input.uncertaintyAgent.ece +
        0.3 * (1 - input.uncertaintyAgent.finalConfidence) +
        0.2 * Math.min(1, input.uncertaintyAgent.dissentCount / 5),
    ).toFixed(4),
  );

  return {
    agentId: "uncertainty-agent-v1",
    status: "ok",
    uncertaintyScore,
    severity: uncertaintyScore >= 0.45 ? "high" : uncertaintyScore >= 0.25 ? "medium" : "low",
    recommendation:
      uncertaintyScore >= 0.45
        ? "require human review before operational escalation"
        : "continue monitoring with calibrated probability",
  };
}
