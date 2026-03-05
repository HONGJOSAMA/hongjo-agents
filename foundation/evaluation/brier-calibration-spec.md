# Brier & Calibration Spec

작성일: 2026-03-05

## Brier Score
- 정의: mean((p - y)^2)
- 입력: prediction probability p, observed label y(0/1)

## Calibration (ECE)
- 확률 구간(bin)별 예측 확률 평균과 실제 발생률 차이
- 목표: Alpha <= 0.10, Beta <= 0.08

## 리포트 단위
- 일간: 품질 조기 경보
- 주간: 운영 보고
- 월간: 모델/가중치 정책 검토

## 경보
- Brier > 0.30
- ECE > 0.15
