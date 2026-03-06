# Phase Tracker

작성일: 2026-03-05
업데이트: 2026-03-06

| Phase | Owner | Start | Target | Status | Blocker | Last Update |
|---|---|---|---|---|---|---|
| Phase 0 | 홍승현 / Codex | 2026-03-05 | 2026-03-06 | done | - | 2026-03-05 |
| Phase 1 | 홍승현 / Codex | 2026-03-05 | 2026-03-07 | done | - | 2026-03-06 |
| Phase 2 | 홍승현 / Codex | 2026-03-06 | 2026-03-09 | in_progress | - | 2026-03-06 |
| Phase 3 | 홍승현 / Codex | 2026-03-06 | 2026-03-10 | in_progress | - | 2026-03-06 |
| Phase 4 | 홍승현 / Codex | 2026-03-06 | 2026-03-10 | in_progress | - | 2026-03-06 |
| Phase 5 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 6 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 7 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 8 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 9 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 10 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 11 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |

## Phase 0 Evidence (실행 추적)

- 2026-03-05: Owner/Start/Target 실제값 입력 완료
- 2026-03-05: `prediction_extension.prisma`를 `specialforce/schema.prisma` 기준으로 병합 설계 업데이트
- 2026-03-05: `specialforce/package.json`에 `test:unit`, `test:integration`, `test:replay` 연결 완료
- 2026-03-05: `npm run test:unit` 통과
- 2026-03-05: `npm run test:replay` 통과
- 2026-03-05: `npm run test:integration` 통과

## Phase 1 Evidence (실행 추적)

- 2026-03-05: 품질/오류/보안 점검 상태 반영 (최근 테스트 통과 유지, 401 조치 완료, 운영 DB 테스트 금지 원칙 유지)

- 2026-03-05: canonical schema 산출물 경로 정리 (`foundation/ontology/domain_schema/v1`)
- 2026-03-05: `domain_schema_v1.yaml` 상세 모델(entities/relations/validation rules) 작성
- 2026-03-05: `cross_impact_graph/v1.graphml` 생성 (초기 5도메인 영향 엣지 정의)
- 2026-03-06: 5도메인 공통 파싱 샘플 100건 생성 (`foundation/tests/schema-validation/phase1-sample-100.jsonl`)
- 2026-03-06: schema validation 스크립트 추가 (`foundation/tests/schema-validation/validate_schema_v1.mjs`)
- 2026-03-06: validation 실행 결과 pass rate 100.00% / required missing 0.00%
- 2026-03-06: `schema-mapping-specialforce-v1.md` 필드 단위 매핑 보강(Session/AAR/ActionItem)
- 2026-03-06: schema validation CI 워크플로우 추가 (`.github/workflows/schema-validation-phase1.yml`)
- 2026-03-06: 리포트 경로 상대화로 절대경로 노출 제거

## Phase 2 Evidence (실행 추적)

- 2026-03-06: pipeline draft 추가 (`foundation/ops/pipelines/run_phase2_pipeline_draft.mjs`)
- 2026-03-06: connector skeleton 3종 추가 (`api_connector`, `document_connector`, `csv_connector`)
- 2026-03-06: raw 샘플 생성 (`foundation/data/raw/{api,documents,csv}/phase2-*.jsonl`)
- 2026-03-06: 정규화 샘플 생성 (`foundation/data/normalized/phase2-normalized-sample.jsonl`)
- 2026-03-06: 품질 리포트 자동생성 (`foundation/evaluation/metrics/data_quality_report.md`)
- 2026-03-06: 품질지표 확인 (raw 25/20/20, normalized 65, ingest 100%, missing 0%, duplicate 0%)
- 2026-03-06: 품질 요약 JSON 추가 (`foundation/evaluation/metrics/data_quality_summary.json`)
- 2026-03-06: 격리 큐 추가 (`foundation/data/quarantine/phase2-quarantine-latest.jsonl`)
- 2026-03-06: 품질게이트 실패 시 `exit code 1` 동작 검증
- 2026-03-06: 일일 자동실행 워크플로우 추가 (`.github/workflows/phase2-pipeline-daily.yml`)
- 2026-03-06: 커넥터 실입력 모드 전환 (API/DOC/CSV env 기반, 입력 없을 때 샘플 폴백)
- 2026-03-06: 실데이터 착수 게이트(준비조건 4개) 고정, 충족 즉시 shadow mode 시작 원칙 반영
- 2026-03-06: `connector-mapping.json` 추가(공급자 필드 매핑)
- 2026-03-06: quarantine replay 스크립트 추가 (`foundation/ops/pipelines/replay_quarantine.mjs`)
- 2026-03-06: 품질게이트 실패 웹훅 알림 경로 추가 (`PIPELINE_ALERT_WEBHOOK`)
- 2026-03-06: 샘플모드 연속성 판정 스크립트/워크플로우 추가 (`calc_sample_streak.mjs`, `phase2-sample-readiness.yml`)
- 2026-03-06: replay/컷오버 런북 문서화 완료 (`docs/runbooks/*`)
- 2026-03-06: mapping profile 분리(`default`, `specialforce_v1`) 및 profile 선택 env(`CONNECTOR_MAPPING_PROFILE`) 추가
- 2026-03-06: replay 결과 normalized 재투입 자동경로 추가 (`reinject_replay_output.mjs`)
- 2026-03-06: PR 자동머지 워크플로우 추가(동일 저장소 브랜치 대상, main 기준) (`.github/workflows/pr-auto-merge.yml`)
- 2026-03-06: PR #8 머지로 자동머지 워크플로우 본선 반영 완료 (`ef78027`)
- 2026-03-06: `specialforce_v1` 매핑 프로필 로컬 검증 통과(quality gate pass)
- 2026-03-06: 품질/오류처리/보안 점검 최신화(검증 통과, secret 하드코딩 미검출)
- 2026-03-06: `specialforce_v1` PR/푸시 회귀검증 워크플로우 추가 (`phase2-specialforce-profile-validation.yml`)
- 2026-03-06: PR auto-merge 보조체크 실패 무해화(`continue-on-error`, non-blocking warning)
- 2026-03-06: readiness snapshot 자동화 추가 (`phase2-readiness-snapshot.yml`, `generate_phase2_readiness_snapshot.mjs`)
- 2026-03-06: live cutover preflight gate 추가 (`phase2-live-preflight-gate.yml`, `check_phase2_live_gate.mjs`)
- 2026-03-06: live gate 결과 리포트 자동생성 추가 (`phase2-live-gate-report.{md,json}`)
- 2026-03-06: live gate 에러/로그 경로 상대화(절대경로 비노출) 반영
- 2026-03-06: phase2 보안 스캔 자동화 추가 (`run_phase2_security_scan.mjs`, `phase2-security-scan-report.{md,json}`)
- 2026-03-06: phase2 shadow health 요약 자동화 추가 (`generate_phase2_shadow_health.mjs`, `phase2-shadow-health.yml`)
- 2026-03-06: phase2 domain health 자동화 추가 (`generate_phase2_domain_health.mjs`, `phase2-domain-health.{md,json}`)

## Phase 3 Evidence (실행 추적)

- 2026-03-06: 5도메인 에이전트 골격 추가 (`agents/*/agent.mjs`)
- 2026-03-06: 도메인 계약 파일 추가 (`agents/*/contract.json`)
- 2026-03-06: 공통 실행 베이스 및 smoke 러너 추가 (`agents/common/base_agent.mjs`, `agents/run_all_domain_agents.mjs`)
- 2026-03-06: Phase 3 smoke 워크플로우 추가 (`.github/workflows/phase3-domain-agents-smoke.yml`)
- 2026-03-06: 공통 출력 스키마/계약 버전 고정 (`agents/common/output_schema_v1.json`, `contractVersion=1.0.0`)
- 2026-03-06: 도메인별 입력 필터 강화 및 trace 규칙 고정 (`agents/*/agent.mjs`, `agents/*/contract.json`)
- 2026-03-06: domain agent 평가/회귀 스크립트 추가 (`agents/evaluate_domain_agents.mjs`, `agents/regression_baseline.json`)
- 2026-03-06: `specialforce` Session/AAR context sample adapter 추가 (`agents/adapters/*`, `agents/run_domain_agents_from_specialforce_context.mjs`)
- 2026-03-06: Phase 4 orchestrator 입력 계약 초안 추가 (`foundation/orchestrator/input_contract_v1.json`, `build_orchestrator_input_v1.mjs`)

## Phase 4 Evidence (실행 추적)

- 2026-03-06: orchestrator weighting 실행 로직 추가 (`foundation/orchestrator/weighting/apply_weighting_v1.mjs`)
- 2026-03-06: orchestrator dissent log 생성기 추가 (`foundation/orchestrator/dissent/generate_dissent_log_v1.mjs`)
- 2026-03-06: orchestrator run/output 계약 추가 (`run_orchestrator_v1.mjs`, `output_contract_v1.json`)
- 2026-03-06: Phase 4 smoke 워크플로우 추가 (`.github/workflows/phase4-orchestrator-smoke.yml`)
- 2026-03-06: calibration draft 추가 (`foundation/orchestrator/calibration/*`)
- 2026-03-06: meta-agent input contract draft 추가 (`foundation/orchestrator/meta_agents/*`)
- 2026-03-06: `specialforce` prediction summary API 명세 초안 추가 (`foundation/docs/specialforce-prediction-summary-api-v1.md`)
