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
