# Compliance Gate

작성일: 2026-03-05

## 데이터 소스 승인 조건
1. license/ToS 확인
2. 출처 신뢰도 등급 부여(A~D)
3. PII 포함 여부 판정
4. 보관/삭제 정책 매핑

## 차단 규칙
- license 불명확: 차단
- PII 마스킹 실패: 차단
- 출처 신뢰도 D + 핵심 예측 입력: 차단
- 출처 신뢰도 C: 보조신호로만 사용

## 승인 절차
- 요청자 -> 리뷰어 -> 보안담당 승인
- 승인 기록은 `data-source-registry.md`에 반영

## CI/머지 게이트
- `phase1-schema-validation` GitHub Actions 상태가 `success`가 아니면 머지 금지
- 브랜치 보호 규칙에서 필수 상태 검사(required status checks)로 아래 항목을 고정
  - `phase1-schema-validation / validate`
