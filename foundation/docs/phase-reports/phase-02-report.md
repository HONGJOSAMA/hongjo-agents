# Phase 02 Report

작성일: 2026-03-06
상태: in_progress

## 완료 작업
- Data Pipeline V1 착수용 파이프라인 초안 추가
  - `foundation/ops/pipelines/run_phase2_pipeline_draft.mjs`
  - `foundation/ops/pipelines/README.md`
- 커넥터 3종 스켈레톤 추가
  - `foundation/ops/pipelines/connectors/api_connector.mjs`
  - `foundation/ops/pipelines/connectors/document_connector.mjs`
  - `foundation/ops/pipelines/connectors/csv_connector.mjs`
- raw 샘플 산출물 생성
  - `foundation/data/raw/api/phase2-api-sample.jsonl`
  - `foundation/data/raw/documents/phase2-doc-sample.jsonl`
  - `foundation/data/raw/csv/phase2-csv-sample.jsonl`
- 정규화 샘플 산출물 생성
  - `foundation/data/normalized/phase2-normalized-sample.jsonl`
- 데이터 품질 리포트 자동 생성
  - `foundation/evaluation/metrics/data_quality_report.md`
- 품질 요약 JSON 자동 생성
  - `foundation/evaluation/metrics/data_quality_summary.json`
- 품질 실패 데이터 격리 큐 추가
  - `foundation/data/quarantine/phase2-quarantine-latest.jsonl`
- 일일 자동 실행 워크플로우 추가
  - `.github/workflows/phase2-pipeline-daily.yml`
- 커넥터 실입력 모드 전환(환경변수 기반)
  - `foundation/ops/pipelines/connectors/common.mjs`
  - `foundation/ops/pipelines/connectors/api_connector.mjs`
  - `foundation/ops/pipelines/connectors/document_connector.mjs`
  - `foundation/ops/pipelines/connectors/csv_connector.mjs`
  - `foundation/ops/pipelines/README.md`
- 공급자 필드 매핑 설정 파일 추가
  - `foundation/ops/pipelines/connectors/connector-mapping.json`
- 매핑 프로필 분리
  - `default`, `specialforce_v1` profile 지원
- 격리 큐 재처리(replay) 스크립트 추가
  - `foundation/ops/pipelines/replay_quarantine.mjs`
  - `foundation/evaluation/metrics/quarantine-replay-report.md`
- replay 결과 normalized 재투입 스크립트 추가
  - `foundation/ops/pipelines/reinject_replay_output.mjs`
  - `foundation/evaluation/metrics/reinject-replay-report.md`
- 품질게이트 실패 웹훅 알림 연결
  - `.github/workflows/phase2-pipeline-daily.yml` (`PIPELINE_ALERT_WEBHOOK`)
- 샘플모드 연속 성공 판정 자동화
  - `.github/workflows/phase2-sample-readiness.yml`
  - `foundation/ops/pipelines/calc_sample_streak.mjs`
  - `foundation/evaluation/metrics/sample-mode-readiness.{md,json}`
- 운영 런북 문서화
  - `foundation/docs/runbooks/phase2-quarantine-replay-runbook.md`
  - `foundation/docs/runbooks/phase2-live-shadow-cutover-checklist.md`
- PR 자동머지 워크플로우 추가 및 머지 완료
  - `.github/workflows/pr-auto-merge.yml`
  - PR #8 merge 완료 (`ef78027`)
- `specialforce_v1` 매핑 프로필 회귀 검증 워크플로우 추가
  - `.github/workflows/phase2-specialforce-profile-validation.yml`
- readiness 스냅샷 자동화 워크플로우 추가
  - `.github/workflows/phase2-readiness-snapshot.yml`
  - `foundation/ops/pipelines/generate_phase2_readiness_snapshot.mjs`
- live 전환 preflight gate 추가
  - `.github/workflows/phase2-live-preflight-gate.yml`
  - `foundation/ops/pipelines/check_phase2_live_gate.mjs`
  - `foundation/evaluation/metrics/phase2-live-gate-report.{md,json}` 자동 생성
  - gate 에러 경로 상대화(절대경로 비노출)
- PR auto-merge 보조 체크 안정화
  - `.github/workflows/pr-auto-merge.yml` (`continue-on-error`, 비차단 경고 처리 강화)

## 검증 결과
- pipeline draft 실행 성공
  - raw api/document/csv records: 25 / 20 / 20
  - normalized records: 65
  - ingest success rate: 100%
  - missing rate: 0%
  - duplicate rate: 0%
  - quality gate: pass
- 게이트 실패 동작 검증
  - `PIPELINE_MIN_INGEST_SUCCESS_RATE=101`로 실행 시 `exit code 1` 확인
- 실입력 모드 검증
  - API 실연결 미설정 시 샘플 폴백 동작 확인
  - 문서/CSV 입력 경로 존재 시 실파일 우선 ingestion 동작 확인
- replay 스크립트 검증
  - quarantine 입력 0건 기준 replay 결과 0건, unresolved 0건 확인
- reinject 스크립트 검증
  - replay 0건 기준 reinject 0건, duplicate skip 동작 확인
- sample readiness 스크립트 검증
  - 연속 성공 streak 계산 및 readiness 리포트 출력 확인
- `specialforce_v1` 매핑 프로필 검증
  - `CONNECTOR_MAPPING_PROFILE=specialforce_v1` 실행 기준 quality gate pass(ingest 100%, missing 0%, duplicate 0%)
- readiness 스냅샷 생성 검증
  - 로컬 실행 기준 스냅샷 md/json 생성 확인
- live gate 스크립트 검증
  - 현재 readiness 미충족 기준으로 fail 조건/사유 출력 확인
  - gate report md/json 산출물 생성 확인(상대경로 기준)
  - snapshot 누락 오류 시에도 상대경로로만 에러 기록 확인
- 최신 점검 반영
  - 품질검사: schema validate 100/100, pipeline quality gate pass
  - 오류처리: 게이트 실패 시 `exit code 1`, quarantine replay/reinject 경로 유지
  - 보안: 하드코딩 secret/token 패턴 미검출, same-repo PR만 auto-merge 대상

## 리스크/이슈
- API 응답 스키마가 공급자별로 다를 수 있어 field mapping 표준화 추가 필요
- 웹훅 알림 코드는 연결되었으나 `PIPELINE_ALERT_WEBHOOK` secret 미등록 시 미동작

## 다음 작업
- 웹훅 알림 채널 운영(실제 secret 등록 및 수신 검증)
- sample mode 3회 연속 성공 달성 후 readiness `ready=true` 확인
- specialforce 실제 응답 샘플로 `specialforce_v1` profile 검증 범위를 실데이터 shadow 모드까지 확장

## 실데이터 착수 기준(고정)
아래 4개 준비조건 충족 즉시 실데이터 shadow mode를 시작한다.
1. API 소스 1개 이상 확정(`API_BASE_URL`/토큰 발급 가능)
2. 필드 매핑표 초안 완료(최소 `id`, `organizationId`, `domainKey`, `observedAt/createdAt`)
3. 샘플 모드 일일 실행 3회 연속 성공
4. 실패 대응 준비 완료(quarantine 확인 + 재실행 절차 문서화)

shadow mode 3~5일 동안 품질 기준 유지 시 운영 모드로 전환한다.

## 사용자 판단 필요 항목
- 없음(계속 진행 가능)
