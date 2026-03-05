# Phase Tracker

작성일: 2026-03-05
업데이트: 2026-03-06

| Phase | Owner | Start | Target | Status | Blocker | Last Update |
|---|---|---|---|---|---|---|
| Phase 0 | 홍승현 / Codex | 2026-03-05 | 2026-03-06 | done | - | 2026-03-05 |
| Phase 1 | 홍승현 / Codex | 2026-03-05 | 2026-03-07 | done | - | 2026-03-06 |
| Phase 2 | 홍승현 / Codex | 2026-03-06 | 2026-03-09 | in_progress | - | 2026-03-06 |
| Phase 3 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
| Phase 4 | 홍승현 / Codex | TBD | TBD | pending | - | 2026-03-05 |
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
