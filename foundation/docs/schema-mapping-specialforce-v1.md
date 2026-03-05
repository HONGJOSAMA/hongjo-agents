# Schema Mapping: Specialforce v1

작성일: 2026-03-05
업데이트: 2026-03-06

## 매핑 범위
- Canonical schema: `Observation/Hypothesis/Prediction/Evidence/Dissent/Outcome/ActionItemLink`
- Baseline schema: `Organization`, `TrainingSession`, `AARReport`, `ActionItem`, `User`, `Prediction*` 확장 모델

## 핵심 엔티티 연결
| Canonical Entity | Specialforce Model | 주요 필드 매핑 |
|---|---|---|
| `Observation` | `PredictionRun` 입력 페이로드(JSON/adapter) | `organizationId`, `domainKey`, `sourceType`, `sourceKey`, `observedAt`, `confidence` |
| `Hypothesis` | `PredictionRun` 보조 페이로드(JSON/adapter) | `organizationId`, `domainKey`, `claim`, `assumptions`, `createdAt` |
| `Prediction` | `PredictionRun` | `id`, `organizationId`, `runKey`, `domainKey`, `horizonValue`, `horizonUnit`, `probability`, `confidence`, `modelVersion`, `promptHash`, `createdAt` |
| `Evidence` | `PredictionEvidence` | `predictionId -> predictionRunId`, `sourceUrl`, `sourceTitle`, `trustScore`, `freshness`, `excerpt` |
| `Dissent` | `PredictionDissent` | `predictionId -> predictionRunId`, `domainKey`, `dissentReason`, `alternative`, `dissentScore` |
| `Outcome` | `PredictionOutcome` | `predictionId -> predictionRunId`, `outcomeLabel`, `observedResult`, `observedAt`, `impactScore` |
| `ActionItemLink` | `PredictionActionLink` | `predictionId -> predictionRunId`, `actionItemId`, `linkReason`, `createdAt` |

## Session/AAR/ActionItem 필드 단위 매핑
| 기존 모델 | 기존 필드 | 예측 확장 목적지 | 매핑 규칙 |
|---|---|---|---|
| `TrainingSession` | `id` | `PredictionRun.trainingSessionId` | 세션 기준 예측 런 추적 |
| `AARReport` | `id` | `PredictionRun.aarReportId` | AAR과 예측 결과 연결 |
| `ActionItem` | `id` | `PredictionActionLink.actionItemId` | 예측 -> 조치 연결 |
| `Organization` | `id` | 모든 `Prediction*`.organizationId | 조직 경계 강제 |
| `User` | `id` | `PredictionRun.createdByUserId` | 생성 주체 감사 추적 |

## 신규 모델 목적
- `PredictionRun`: 도메인 에이전트 + 오케스트레이터 1회 실행 결과
- `PredictionEvidence`: 예측 근거(출처, 신뢰도, 신선도)
- `PredictionDissent`: 반대 의견 및 대안 시나리오
- `PredictionOutcome`: 실제 결과(정답 라벨)
- `PredictionCalibration`: 모델 보정 파라미터 버전
- `PredictionActionLink`: 예측 결과와 후속조치(ActionItem) 연결

## 무결성 규칙
- 모든 예측 테이블은 `organizationId` 필수
- `PredictionRun`는 기존 세션/AAR와 optional FK로 연결
- `PredictionActionLink`는 `@@unique([predictionRunId, actionItemId])` 유지
- 테이블 설계는 additive-only(기존 컬럼 변경/삭제 금지)
- `organizationId` 불일치 저장 차단

## 병합 체크포인트
1. `specialforce/schema.prisma`에 enum 4종 추가
2. 기존 모델 relation 필드 추가
3. 신규 모델 6종 추가
4. 인덱스/unique 제약 검토 후 migration 생성
5. staging rehearsal 후 prod 적용
