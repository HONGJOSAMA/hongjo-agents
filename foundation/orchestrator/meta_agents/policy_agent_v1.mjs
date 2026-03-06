#!/usr/bin/env node

export function runPolicyAgentV1(input) {
  const actionPriority =
    input.policyAgent.fallbackActivated || input.uncertaintyAgent.dissentCount >= 4 ? "review_now" : "monitor";

  return {
    agentId: "policy-agent-v1",
    status: "ok",
    actionPriority,
    recommendedMode: input.policyAgent.recommendedMode,
    actionItemCount: input.policyAgent.actionItemIds.length,
    recommendation:
      actionPriority === "review_now"
        ? "route to decision owner and attach dissent summary"
        : "publish summary card and keep action items in monitoring lane",
  };
}
