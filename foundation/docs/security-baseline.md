# Security Baseline

작성일: 2026-03-05

## 접근 통제
- 조직 경계(`organizationId`) 강제
- 역할 기반 권한(`ADMIN`, `INSTRUCTOR`, `PARTICIPANT`)
- high-impact 예측은 human approval 필수

## 민감정보
- PII 필드(`email`, `name`)는 최소 수집
- 로그/리포트에는 마스킹 적용
- 무마스킹 데이터는 운영 로그 저장 금지

## 감사
- 예측 생성/승인/변경/배포 액션 모두 감사로그 기록
- 필수 메타: `run_id`, `actor`, `created_at`, `model_version`

## 운영 정책
- 개발/스테이징/운영 DB 분리
- 운영 DB 변경은 2인 승인
- 운영 배포 전 백업 스냅샷 필수

## 코드 머지 통제
- 기본 브랜치 직접 push 금지(PR 경유)
- 필수 CI 실패 시 머지 금지
  - `phase1-schema-validation / validate`
