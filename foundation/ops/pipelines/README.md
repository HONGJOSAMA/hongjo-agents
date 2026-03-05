# Phase 2 Pipeline Draft

## 목적
- Phase 2(Data Pipeline V1) 착수를 위한 최소 실행형 뼈대 제공
- 샘플 입력을 정규화하고 데이터 품질 리포트를 자동 생성

## 실행
```bash
node foundation/ops/pipelines/run_phase2_pipeline_draft.mjs
```

## 산출물
- `foundation/data/raw/api/phase2-api-sample.jsonl`
- `foundation/data/raw/documents/phase2-doc-sample.jsonl`
- `foundation/data/raw/csv/phase2-csv-sample.jsonl`
- `foundation/data/normalized/phase2-normalized-sample.jsonl`
- `foundation/evaluation/metrics/data_quality_report.md`

## 현재 범위
- 커넥터 실구현 전 단계
- schema-validation 샘플을 기반으로 정규화/품질계산만 수행
