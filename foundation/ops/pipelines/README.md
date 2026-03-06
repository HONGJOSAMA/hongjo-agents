# Phase 2 Pipeline Draft

## 목적
- Phase 2(Data Pipeline V1) 착수를 위한 최소 실행형 뼈대 제공
- 샘플 입력을 정규화하고 데이터 품질 리포트를 자동 생성

## 실행
```bash
# 샘플 모드(기본): API_BASE_URL 없어도 통과
node foundation/ops/pipelines/check_phase2_env.mjs

# 라이브 모드: API_BASE_URL 필수
PIPELINE_MODE=live node foundation/ops/pipelines/check_phase2_env.mjs

node foundation/ops/pipelines/run_phase2_pipeline_draft.mjs
node foundation/ops/pipelines/replay_quarantine.mjs
node foundation/ops/pipelines/reinject_replay_output.mjs
node foundation/ops/pipelines/calc_sample_streak.mjs
node foundation/ops/pipelines/generate_phase2_readiness_snapshot.mjs
```

품질 게이트 임계치(환경변수):
- `PIPELINE_MIN_INGEST_SUCCESS_RATE` (기본 95)
- `PIPELINE_MAX_MISSING_RATE` (기본 5)
- `PIPELINE_MAX_DUPLICATE_RATE` (기본 2)

실데이터 입력 환경변수:
- 실행 모드:
  - `PIPELINE_MODE` (`sample` 또는 `live`, 기본 `sample`)
- 매핑:
  - `CONNECTOR_MAPPING_FILE` (기본 `foundation/ops/pipelines/connectors/connector-mapping.json`)
  - `CONNECTOR_MAPPING_PROFILE` (기본 `default`, 예: `specialforce_v1`)
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
- 공급자별 필드 차이는 `connectors/connector-mapping.json`으로 매핑
- replay 결과는 `reinject_replay_output.mjs`로 normalized stream에 재투입 가능

## 산출물
- `foundation/data/raw/api/phase2-api-sample.jsonl`
- `foundation/data/raw/documents/phase2-doc-sample.jsonl`
- `foundation/data/raw/csv/phase2-csv-sample.jsonl`
- `foundation/data/normalized/phase2-normalized-sample.jsonl`
- `foundation/data/quarantine/phase2-quarantine-latest.jsonl`
- `foundation/data/quarantine/phase2-replay-output.jsonl`
- `foundation/evaluation/metrics/data_quality_report.md`
- `foundation/evaluation/metrics/data_quality_summary.json`
- `foundation/evaluation/metrics/quarantine-replay-report.md`
- `foundation/evaluation/metrics/reinject-replay-report.md`
- `foundation/evaluation/metrics/sample-mode-readiness.md`
- `foundation/evaluation/metrics/sample-mode-readiness.json`
- `foundation/evaluation/metrics/phase2-readiness-snapshot.md`
- `foundation/evaluation/metrics/phase2-readiness-snapshot.json`

## 자동화
- GitHub Actions: `.github/workflows/phase2-pipeline-daily.yml`
- 매일 UTC 00:15 실행 + 수동 실행(`workflow_dispatch`) 지원
- 샘플 연속성 체크: `.github/workflows/phase2-sample-readiness.yml`
- readiness 스냅샷: `.github/workflows/phase2-readiness-snapshot.yml`

## GitHub Secrets/Variables 설정
- Secrets:
  - `API_BASE_URL`
  - `API_TOKEN` (선택)
- Variables:
  - `API_ENDPOINT` (기본 `/observations`)
  - `DOC_INPUT_DIR` (기본 `foundation/data/input/documents`)
  - `CSV_INPUT_DIR` (기본 `foundation/data/input/csv`)
  - `PIPELINE_ORGANIZATION_ID`
  - `PIPELINE_DEFAULT_DOMAIN_KEY`
  - `READINESS_API_SOURCE_CONFIRMED` (`true/false`)
  - `READINESS_MAPPING_DRAFT_DONE` (`true/false`)
  - `READINESS_FAILURE_RESPONSE_READY` (`true/false`, 기본 `true`)

## 현재 범위
- API/문서/CSV 실입력 모드 기본 구현 완료(입력 부재 시 샘플 폴백)
- shadow mode 진입 전 준비조건(연속성/재처리/컷오버 체크리스트) 운영 중
