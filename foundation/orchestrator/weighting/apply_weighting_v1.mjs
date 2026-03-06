#!/usr/bin/env node

export function computeRiskMultiplier(riskLevel) {
  if (riskLevel === "high") {
    return 1.15;
  }
  if (riskLevel === "medium") {
    return 1.05;
  }
  return 0.95;
}

export function computeEvidenceMultiplier(evidenceCount) {
  return Math.min(1.2, 0.9 + evidenceCount * 0.08);
}

export function applyWeightingV1(input) {
  const contributions = input.domainRuns.map((run) => {
    const evidenceMultiplier = computeEvidenceMultiplier(run.evidenceCount);
    const riskMultiplier = computeRiskMultiplier(run.riskLevel);
    const confidenceMultiplier = Math.max(0.6, run.confidence);
    const weight = Number((confidenceMultiplier * evidenceMultiplier * riskMultiplier).toFixed(4));
    const weightedProbability = Number(Math.min(0.99, run.probability * weight).toFixed(4));

    return {
      domainKey: run.domainKey,
      baseProbability: run.probability,
      weightedProbability,
      confidence: run.confidence,
      riskLevel: run.riskLevel,
      weight,
    };
  });

  const totalWeight = contributions.reduce((acc, item) => acc + item.weight, 0);
  const weightedProbability =
    totalWeight === 0
      ? 0.5
      : Number(
          (
            contributions.reduce((acc, item) => acc + item.baseProbability * item.weight, 0) / totalWeight
          ).toFixed(4),
        );

  const averageConfidence = Number(
    (
      contributions.reduce((acc, item) => acc + item.confidence, 0) / Math.max(contributions.length, 1)
    ).toFixed(4),
  );

  return {
    weightingVersion: "phase4-weighting-v1",
    selectedPolicyRule: input.aggregate.selectedPolicyRule,
    weightFactors: {
      confidence: "base",
      evidenceCount: "0.9 + evidenceCount*0.08 (cap 1.2)",
      riskLevel: "low=0.95, medium=1.05, high=1.15",
    },
    contributions,
    weightedProbability,
    averageConfidence,
  };
}
