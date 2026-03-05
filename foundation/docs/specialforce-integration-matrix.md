# Specialforce Integration Matrix

작성일: 2026-03-05

| 모듈 | 분류 | 처리 방식 | Owner | 비고 |
|---|---|---|---|---|
| 인증/권한 | As-Is | 재사용 | TBD | 회귀테스트 필수 |
| 세션/AAR 루프 | As-Is | 재사용 | TBD | 예측 카드만 추가 |
| 액션아이템 | Modify | 피드백 역주입 | TBD | 완료결과 학습연계 |
| 감사로그 | Modify | 예측 이벤트 확장 | TBD | run_id 저장 |
| Prediction API | New | specialforce app/api/prediction/* | TBD | orchestrator 연결 |
| Domain Agents | New | 별도 worker + adapter | TBD | 5개 도메인 시작 |
