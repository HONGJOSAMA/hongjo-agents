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

## 리스크/이슈
- API 응답 스키마가 공급자별로 다를 수 있어 field mapping 표준화 추가 필요
- 외부 알림(Slack/Email/Webhook)은 아직 미연결

## 다음 작업
- API 응답 필드 매핑 설정 파일(`connector-mapping.json`) 도입
- 격리 큐 재처리 경로(replay) 스크립트 추가
- 품질게이트 실패 시 알림 채널(Webhook) 연결

## 실데이터 착수 기준(고정)
아래 4개 준비조건 충족 즉시 실데이터 shadow mode를 시작한다.
1. API 소스 1개 이상 확정(`API_BASE_URL`/토큰 발급 가능)
2. 필드 매핑표 초안 완료(최소 `id`, `organizationId`, `domainKey`, `observedAt/createdAt`)
3. 샘플 모드 일일 실행 3회 연속 성공
4. 실패 대응 준비 완료(quarantine 확인 + 재실행 절차 문서화)

shadow mode 3~5일 동안 품질 기준 유지 시 운영 모드로 전환한다.

## 사용자 판단 필요 항목
- 없음(계속 진행 가능)
