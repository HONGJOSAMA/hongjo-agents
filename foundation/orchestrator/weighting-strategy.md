# Orchestrator Weighting Strategy

작성일: 2026-03-05

## 기본 가중치 요소
- 도메인 신뢰도(과거 성능)
- 데이터 최신성
- 근거 신뢰도 평균
- 불확실성 패널티

## 충돌해결
1. 정책 위반 가능 시나리오 하향
2. calibration 후 가중합
3. 동률 시 최소리스크 시나리오 선택
4. high-impact는 human approval

## fallback
- 데이터 부족: conservative mode
- 타임아웃: 부분 결과 + 경고
- 충돌 과다: dissent 우선 보고
