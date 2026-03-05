# ADR-001 Integration Strategy

상태: accepted
작성일: 2026-03-05

결정:
- specialforce in-place 확장 + hongjo 설계 모듈화

근거:
- 기존 운영 루프 재사용으로 일정 단축
- 데이터 일관성 확보
- 회귀 테스트 범위 명확

영향:
- specialforce API/DB에 additive 확장 필요
- integration matrix 지속 관리 필요
