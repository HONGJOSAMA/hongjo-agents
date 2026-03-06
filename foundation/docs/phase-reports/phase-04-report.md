# Phase 04 Report

작성일: 2026-03-06
상태: in_progress

## 완료 작업
- 오케스트레이터 출력 계약 초안 추가
  - `foundation/orchestrator/output_contract_v1.json`
- weighting 실행 로직 추가
  - `foundation/orchestrator/weighting/apply_weighting_v1.mjs`
- dissent log 생성기 추가
  - `foundation/orchestrator/dissent/generate_dissent_log_v1.mjs`
- 오케스트레이터 실행기 추가
  - `foundation/orchestrator/run_orchestrator_v1.mjs`
- calibration 초안 추가
  - `foundation/orchestrator/calibration/run_calibration_v1.mjs`
  - `foundation/orchestrator/calibration/reference_outcomes_v1.json`
- 메타 에이전트 입력 계약 초안 추가
  - `foundation/orchestrator/meta_agents/input_contract_v1.json`
  - `foundation/orchestrator/meta_agents/build_meta_agent_input_v1.mjs`
- `specialforce` prediction summary API 명세 초안 추가
  - `foundation/docs/specialforce-prediction-summary-api-v1.md`
- Phase 4 smoke 워크플로우 추가
  - `.github/workflows/phase4-orchestrator-smoke.yml`

## 검증 결과
- `agents/run_domain_agents_from_specialforce_context.mjs` 통과
- `foundation/orchestrator/build_orchestrator_input_v1.mjs` 통과
- `foundation/orchestrator/run_orchestrator_v1.mjs` 통과
- `foundation/evaluation/orchestrator/phase4-orchestrator-output-v1.json` 생성 확인
- `foundation/evaluation/metrics/phase4-orchestrator-run.{md,json}` 생성 확인
- `foundation/evaluation/orchestrator/phase4-calibrated-output-v1.json` 생성 확인
- `foundation/evaluation/orchestrator/phase4-meta-agent-input-v1.json` 생성 확인
- calibration/meta-agent smoke 리포트 생성 확인

## 리스크/이슈
- weighting은 현재 heuristic v1이며 과거 성능/calibration은 아직 미연결
- `specialforce` UI/API 카드 연결은 아직 미구현

## 다음 작업
- calibration을 historical outcome 파이프라인과 연결
- `specialforce` prediction summary API를 실제 app/api 규격으로 구체화
- 메타 에이전트 3종의 개별 실행 로직 추가
