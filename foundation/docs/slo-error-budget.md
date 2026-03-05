# SLO and Error Budget

작성일: 2026-03-05

## SLO
- Availability: 99.5% / 30일
- Orchestrator latency: p95 <= 10s, p99 <= 15s
- Pipeline success: >= 98%
- Cost per prediction: <= $0.05 (초기)

## Error Budget Policy
- 50% 소진: 신규 기능 감속
- 100% 소진: 안정화 외 배포 동결

## 대응
- 위반 시 runbook 발동
- 원인 분석 후 정책/가중치 업데이트
