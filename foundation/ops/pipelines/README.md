# Phase 2 Pipeline Draft

## 목적
- Phase 2(Data Pipeline V1) 착수를 위한 최소 실행형 뼈대 제공
- 샘플 입력을 정규화하고 데이터 품질 리포트를 자동 생성

## 실행
```bash
node foundation/ops/pipelines/run_phase2_pipeline_draft.mjs
```

품질 게이트 임계치(환경변수):
- `PIPELINE_MIN_INGEST_SUCCESS_RATE` (기본 95)
- `PIPELINE_MAX_MISSING_RATE` (기본 5)
- `PIPELINE_MAX_DUPLICATE_RATE` (기본 2)

실데이터 입력 환경변수:
- 공통:
  - `PIPELINE_ORGANIZATION_ID` (기본 `org-demo-001`)
  - `PIPELINE_DEFAULT_DOMAIN_KEY` (기본 `cyber_information`)
- API 커넥터:
  - `API_BASE_URL` (예: `https://api.example.com`)
  - `API_ENDPOINT` (기본 `/observations`)
  - `API_TOKEN` (선택)
  - `API_TIMEOUT_MS` (기본 15000)
- 문서 커넥터:
  - `DOC_INPUT_DIR` (기본 `foundation/data/input/documents`)
  - `DOC_MAX_ROWS` (기본 200)
- CSV 커넥터:
  - `CSV_INPUT_DIR` (기본 `foundation/data/input/csv`)
  - `CSV_MAX_ROWS` (기본 500)

동작 방식:
- 실데이터 입력 경로/API 응답이 있으면 실데이터 우선 사용
- 입력이 비어 있으면 샘플 데이터로 폴백하여 파이프라인을 지속 실행

## 산출물
- `foundation/data/raw/api/phase2-api-sample.jsonl`
- `foundation/data/raw/documents/phase2-doc-sample.jsonl`
- `foundation/data/raw/csv/phase2-csv-sample.jsonl`
- `foundation/data/normalized/phase2-normalized-sample.jsonl`
- `foundation/data/quarantine/phase2-quarantine-latest.jsonl`
- `foundation/evaluation/metrics/data_quality_report.md`
- `foundation/evaluation/metrics/data_quality_summary.json`

## 자동화
- GitHub Actions: `.github/workflows/phase2-pipeline-daily.yml`
- 매일 UTC 00:15 실행 + 수동 실행(`workflow_dispatch`) 지원

## 현재 범위
- 커넥터 실구현 전 단계
- schema-validation 샘플을 기반으로 정규화/품질계산만 수행
