# Replay Scenarios

작성일: 2026-03-05

## 목적
동일 입력 재실행 시 동일 결과를 재현(run_id/model_version/prompt_hash)

## 시나리오
1. 경제 안정 + 지정학 악화 충돌 케이스
2. 공급망 경보 + 정치 완화 시그널 충돌 케이스
3. 근거 부족 fallback 케이스
4. high-impact human approval 케이스

## 검증 항목
- 동일 run 입력 시 결과 동일성
- dissent log 생성 여부
- fallback 동작 여부
