# Phase 2 Live Shadow Cutover Checklist

## 실행 시점
- 준비조건 4개 충족 즉시(D-0)

## 준비조건
1. API 소스 1개 이상 확정(`API_BASE_URL`/토큰 발급 가능)
2. 필드 매핑표 초안 완료(`connector-mapping.json`)
3. 샘플모드 3회 연속 성공(`sample-mode-readiness.json`)
4. 실패 대응 준비 완료(quarantine replay runbook 확인)

## D-0 체크리스트
- [ ] Secrets 등록
  - [ ] `API_BASE_URL`
  - [ ] `API_TOKEN` (필요 시)
  - [ ] `PIPELINE_ALERT_WEBHOOK` (권장)
- [ ] Variables 확인
  - [ ] `API_ENDPOINT`
  - [ ] `PIPELINE_ORGANIZATION_ID`
  - [ ] `PIPELINE_DEFAULT_DOMAIN_KEY`
- [ ] `phase2-pipeline-daily` 수동 실행 1회
- [ ] `data_quality_report.md` 기준 품질게이트 통과 확인
- [ ] 결과를 shadow mode로만 관찰(운영 의사결정 미반영)

## shadow mode 운영(3~5일)
- [ ] 일일 ingest 성공률 >= 95%
- [ ] 결측률 <= 5%
- [ ] 중복률 <= 2%
- [ ] unresolved quarantine 0 유지

## 전환 조건
- 3~5일 연속 기준 충족 시 운영 모드 전환 승인
