# ADR-002 DB Migration Policy

상태: accepted
작성일: 2026-03-05

결정:
- shared DB + additive migration
- destructive migration 금지

운영 규칙:
- prod migration 2인 승인
- staging 리허설 필수
- prod 전 백업 스냅샷
- rollback은 forward-fix 우선
