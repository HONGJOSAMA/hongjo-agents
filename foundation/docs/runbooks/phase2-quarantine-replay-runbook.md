# Phase 2 Quarantine Replay Runbook

## 목적
- 품질게이트 실패/격리 데이터 발생 시 재처리 절차를 표준화한다.

## 입력/출력
- 입력: `foundation/data/quarantine/phase2-quarantine-latest.jsonl`
- 출력:
  - `foundation/data/quarantine/phase2-replay-output.jsonl`
  - `foundation/evaluation/metrics/quarantine-replay-report.md`
  - `foundation/evaluation/metrics/reinject-replay-report.md`

## 절차
1. quarantine 파일 존재 확인
2. 아래 명령 실행
   - `node foundation/ops/pipelines/replay_quarantine.mjs`
3. 결과 확인
   - `replayed`가 0보다 크면 replay-output 검토
   - `unresolved`가 0보다 크면 필드 매핑/원천데이터 보정 후 재실행
4. 필요 시 pipeline 재실행
   - `node foundation/ops/pipelines/run_phase2_pipeline_draft.mjs`
5. replay 결과를 normalized stream에 재투입
   - `node foundation/ops/pipelines/reinject_replay_output.mjs`

## 판정
- 성공: `unresolved=0`
- 실패: `unresolved>0` (원인 보정 후 재처리)

## 운영 주의
- replay는 `organizationId/domainKey/시간` 누락 보정만 수행한다.
- 원천 데이터 품질 이슈가 반복되면 `connector-mapping.json` 보강이 우선이다.
