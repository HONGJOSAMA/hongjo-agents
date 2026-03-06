# Specialforce Prediction Summary API V1

작성일: 2026-03-06
상태: draft

## 목적
- `specialforce` AAR 화면에서 prediction summary 카드를 노출하기 위한 최소 API 명세
- Phase 4 orchestrator output, calibration output, meta-agent input을 한 번에 조회하는 용도

## Endpoint
- `GET /api/prediction/summary`

## Query Parameters
- `organizationId` (required)
- `trainingSessionId` (optional)
- `aarReportId` (optional)

## Response Shape
```json
{
  "organizationId": "org-demo-001",
  "trainingSessionId": "session-01",
  "aarReportId": "aar-01",
  "finalPrediction": {
    "probability": 0.72,
    "confidence": 0.72,
    "riskLevel": "high",
    "scenarioLabel": "high_consensus_outlook"
  },
  "calibration": {
    "brierScore": 0.1832,
    "ece": 0.144,
    "calibratedProbability": 0.687,
    "calibratedConfidence": 0.72
  },
  "dissentSummary": {
    "count": 5,
    "topDomains": ["macroeconomy", "policy_politics"]
  },
  "policySummary": {
    "selectedPolicyRule": "minimax_regret",
    "fallbackActivated": false,
    "recommendedMode": "standard_monitoring"
  }
}
```

## Data Sources
- `foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json`
- `foundation/evaluation/orchestrator/phase4-calibrated-output-v1.json`
- `foundation/evaluation/orchestrator/phase4-meta-agent-input-v1.json`

## Error Cases
- `404 prediction_summary_not_found`
- `409 prediction_summary_context_mismatch`
- `422 prediction_summary_contract_invalid`

## Notes
- 초기 구현은 read-only summary endpoint로 제한
- Phase 5 이후 evidence panel 링크를 응답에 추가
