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
- Phase 3 smoke 워크플로우 추가
  - `.github/workflows/phase3-domain-agents-smoke.yml`

## 검증 결과
- 각 도메인 독립 실행 가능
- smoke 실행 기준 5개 에이전트 모두 예측 + 가설 + evidence 3건 이상 반환
- `foundation/evaluation/metrics/phase3-domain-agent-smoke.{md,json}` 생성 확인

## 리스크/이슈
- 현재는 heuristic bootstrap 단계라 실제 specialforce Session/AAR 문맥 입력은 아직 미연결
- 메타 에이전트(`Uncertainty`, `Adversarial`, `Policy`)는 미구현

## 다음 작업
- specialforce AAR/ActionItem 문맥 입력 어댑터 연결
- 메타 에이전트 3종 골격 추가
- 에이전트 출력 스키마를 orchestrator 입력 계약과 연결
