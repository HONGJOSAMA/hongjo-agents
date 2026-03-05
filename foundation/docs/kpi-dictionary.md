# KPI Dictionary

작성일: 2026-03-05

## 예측 KPI
- Brier Score: 확률 예측 품질. 낮을수록 좋음.
  - 목표: <= 0.25 (Alpha)
  - 경보: > 0.30
- Calibration (ECE): 예측확률 보정 오차.
  - 목표: <= 0.10 (Alpha), <= 0.08 (Beta)
  - 경보: > 0.15
- Precision / Recall:
  - 목표: Precision >= 0.65, Recall >= 0.60 (Alpha)
- False Alarm Rate / Miss Rate:
  - 목표: FAR <= 0.35, Miss <= 0.30

## 운영 KPI
- Lead Time Median:
  - 목표: >= 24h
  - 경보: < 12h
- AAR 작성시간:
  - 목표: 기준 대비 30% 단축
- ActionItem 완료율:
  - 목표: >= 70% (Beta)
- 재발률:
  - 목표: 분기별 하락 추세

## 사업 KPI
- 파일럿 전환율: >= 20% (초기)
- 사용자 리텐션(4주): >= 60%
- 계정 확장률: 분기별 상승 추세

## 데이터 소스
- Prediction/Outcome: specialforce DB
- ActionItem/AAR: specialforce DB
- 평가 집계: evaluation pipeline
