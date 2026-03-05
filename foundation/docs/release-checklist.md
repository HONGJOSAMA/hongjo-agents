# Release Checklist

작성일: 2026-03-05

## 사전
- [ ] phase report 업데이트
- [ ] compliance gate 통과
- [ ] schema migration 리뷰 완료

## 필수 명령
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm run build
- [ ] npm run test:unit
- [ ] npm run test:integration
- [ ] npm run test:replay
- [ ] GitHub Actions `phase1-schema-validation / validate` 성공 확인

## 운영
- [ ] staging 리허설 완료
- [ ] prod 2인 승인
- [ ] 백업 스냅샷 생성
- [ ] rollback(또는 forward-fix) 계획 확인
