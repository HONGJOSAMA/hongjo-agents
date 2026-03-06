#!/usr/bin/env node

export function generateDissentLogV1(input, weightingResult) {
  return weightingResult.contributions
    .filter((item) => {
      const delta = Math.abs(item.baseProbability - weightingResult.weightedProbability);
      return delta >= 0.12 || (item.riskLevel === "high" && item.baseProbability < weightingResult.weightedProbability);
    })
    .map((item) => ({
      domainKey: item.domainKey,
      dissentScore: Number(Math.abs(item.baseProbability - weightingResult.weightedProbability).toFixed(4)),
      dissentReason:
        item.baseProbability < weightingResult.weightedProbability
          ? "domain signal is more conservative than weighted consensus"
          : "domain signal is more aggressive than weighted consensus",
      alternativeProbability: item.baseProbability,
    }))
    .concat(
      input.dissentLog.map((item) => ({
        domainKey: item.domainKey,
        dissentScore: Number(Math.abs(item.probability - weightingResult.weightedProbability).toFixed(4)),
        dissentReason: item.reason,
        alternativeProbability: item.probability,
      })),
    );
}
