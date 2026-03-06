# Phase 03 Report

작성일: 2026-03-06
상태: in_progress

## 완료 작업
- 초기 5도메인 에이전트 최소 실행형 골격 추가
  - `agents/macroeconomy/agent.mjs`
  - `agents/policy_politics/agent.mjs`
  - `agents/geopolitics_security/agent.mjs`
  - `agents/supply_chain_trade/agent.mjs`
  - `agents/cyber_information/agent.mjs`
- 도메인별 입력/출력 계약 파일 추가
  - `agents/*/contract.json`
- 공통 실행 베이스 추가
  - `agents/common/base_agent.mjs`
  - `agents/run_domain_agent.mjs`
  - `agents/run_all_domain_agents.mjs`
- 공통 출력 스키마/계약 버전 고정
  - `agents/common/output_schema_v1.json`
  - `contractVersion=1.0.0`
  - `schemaVersion=phase3-domain-agent-output/v1`
- 도메인별 입력 필터/회귀 베이스라인 추가
  - `agents/regression_baseline.json`
  - `agents/evaluate_domain_agents.mjs`
- `specialforce` Session/AAR 문맥 어댑터 추가
  - `agents/adapters/generate_specialforce_context_sample.mjs`
  - `agents/adapters/adapt_specialforce_context_to_normalized.mjs`
  - `agents/run_domain_agents_from_specialforce_context.mjs`
- Phase 4 오케스트레이터 입력 계약 초안 추가
  - `foundation/orchestrator/input_contract_v1.json`
  - `foundation/orchestrator/build_orchestrator_input_v1.mjs`
- Phase 3 smoke 워크플로우 추가
  - `.github/workflows/phase3-domain-agents-smoke.yml`

## 검증 결과
- 각 도메인 독립 실행 가능
- smoke 실행 기준 5개 에이전트 모두 예측 + 가설 + evidence 3건 이상 반환
- `foundation/evaluation/metrics/phase3-domain-agent-smoke.{md,json}` 생성 확인
- `foundation/evaluation/metrics/phase3-domain-agent-eval.{md,json}` 생성 확인
- schema/contract/evaluation/regression 기준 pass 확인
- `specialforce` context adapter smoke 생성 확인
- orchestrator input draft json/report 생성 확인

## 리스크/이슈
- 현재는 heuristic bootstrap 단계라 실제 specialforce Session/AAR 문맥 입력은 아직 미연결
- 메타 에이전트(`Uncertainty`, `Adversarial`, `Policy`)는 미구현

## 다음 작업
- 메타 에이전트 3종 골격 추가
- 오케스트레이터 weighting/dissent 실행 로직 추가
- specialforce 실제 Session/AAR API payload와 어댑터 필드 매핑 정교화
