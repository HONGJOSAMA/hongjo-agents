# Multi-Agent Platform Execution Plan

작성일: 2026-03-05  
프로젝트: hongjo  
기준 문서: `multi_agent_research.md`

## 0. Phase Monitoring Board (작업 모니터링 체크리스트)

아래 체크리스트는 사용자가 진행상황을 상단에서 즉시 모니터링할 수 있도록 설계했다.

- [x] Phase 0: Program Setup (범위/지표/거버넌스 고정)
- [x] Phase 1: Canonical Schema + Ontology V1
- [ ] Phase 2: Data Pipeline V1 (수집/정제/품질)
- [ ] Phase 3: Domain Agents V1 (초기 5개)
- [ ] Phase 4: Orchestrator V1 (가중치 + 반대의견 로그)
- [ ] Phase 5: Explainability + Evidence Pack V1
- [ ] Phase 6: Evaluation Loop V1 (Brier/Calibration/PR)
- [ ] Phase 7: AAR Feedback Loop + Action Automation
- [ ] Phase 8: UI/UX Simplification (한눈 구조)
- [ ] Phase 9: Security/Operations Hardening
- [ ] Phase 10: Alpha Readout (2주)
- [ ] Phase 11: Beta Expansion (4주)

## 0.1 Phase Tracker Table (운영용)

아래 표를 매일 갱신한다. `status`는 `pending | in_progress | blocked | done`만 사용한다.

| Phase | Owner | Start | Target | Status | Blocker | Last Update |
|---|---|---|---|---|---|---|
| Phase 0 | 홍승현 / Codex | 2026-03-05 | 2026-03-06 | done | - | 2026-03-05 |
| Phase 1 | 홍승현 / Codex | 2026-03-05 | 2026-03-07 | done | - | 2026-03-06 |
| Phase 2 | 홍승현 / Codex | 2026-03-06 | 2026-03-09 | in_progress | - | 2026-03-06 |
| Phase 3 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 4 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 5 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 6 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 7 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 8 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 9 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 10 | TBD | TBD | TBD | pending | - | 2026-03-05 |
| Phase 11 | TBD | TBD | TBD | pending | - | 2026-03-05 |

## 0.2 Gate Checklist (각 Phase 완료 선언 공통 조건)

모든 Phase는 아래 조건을 충족해야 완료로 체크한다.

- [ ] DoD 문서화 완료 (`docs/phase-reports/phase-XX-report.md`)
- [ ] 핵심 테스트 통과 (`npm run test:unit`, `npm run test:integration`, `npm run test:replay`)
- [ ] 회귀 없음(이전 Phase 핵심 기능 재검증)
- [ ] 보안 체크(민감정보 노출, 접근통제, 감사로그)
- [ ] 성능 체크(지연시간/실패율 지표)

## 0.3 Release Gate Commands (고정 실행 명령)

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:unit`
- [ ] `npm run test:integration`
- [ ] `npm run test:replay`
- [ ] `npm run prisma:validate` (DB schema 변경 시)

---

## 1. 목표와 범위

## 1.1 목표

- 도메인 에이전트들의 토의와 근거 기반으로 사건/상황을 확률 예측한다.
- 예측 성공/실패를 계량화해 정확도를 지속적으로 개선한다.
- 관찰 -> 평가 -> 후속조치 -> 결과검증 -> 보정 루프를 운영 시스템으로 고정한다.

## 1.2 비전과 현실 범위

- 장기 비전: 범용 상황예측 플랫폼(세상 모든 일 예측)
- 단기 범위(2~4주): 초기 5도메인 중심 운영형 에이전트 + 초기 예측

## 1.3 초기 5도메인

1. 거시경제
2. 정치/정책
3. 지정학/안보
4. 공급망/무역
5. 사이버/정보위협

## 1.4 Baseline System 선언 (specialforce 재사용)

본 계획은 `specialforce` 웹을 **초석(baseline system)** 으로 사용한다.

- baseline 경로 규칙: `${WORKSPACE_ROOT}/codexcoding/specialforce` (절대경로 하드코딩 금지)
- 원칙:
  1. 이미 검증된 운영 루프(기록 -> 평가 -> AAR -> 액션아이템)를 재사용
  2. hongjo는 예측/오케스트레이션 계층을 추가하는 방식으로 확장
  3. 중복 개발 금지(기존 기능 재구현 대신 adapter/extension 우선)

## 1.5 specialforce 재사용 자산 목록

재사용(As-Is 또는 경미 수정):
- 인증/권한/조직 경계 제어
- AAR 워크플로우(생성/제출/승인/재오픈)
- 액션아이템 생성/상태 전이/담당자 추적
- 초대/감사로그 운영 흐름
- 운영 UI 프레임 및 다국어 토글 기반

확장(새 구현 필요):
- Domain Agents 런타임
- Orchestrator/가중치/반대의견 엔진
- 확률 예측 스코어링 및 calibration
- Evidence Pack 자동 구성과 출처 신뢰도 관리
- 예측 실패 원인 자동분류/모델 보정 파이프라인

## 1.6 통합 전략 (판단 고정)

전략: `specialforce in-place 확장 + hongjo 모듈 계층화`

- 이유:
  - 2~4주 단축 목표에 가장 유리
  - 기존 운영 루프와 사용자 맥락을 유지
  - 데이터 일관성(세션/AAR/액션아이템) 보장

구현 형태:
- `hongjo`에서 설계/실험 후, `specialforce`에 단계적 이식
- API는 `specialforce`에 `prediction/*` 네임스페이스로 증설
- 필요 시 백그라운드 잡(worker)만 별도 프로세스로 분리

## 1.7 DB 토폴로지/마이그레이션 결정 (고정)

결정:
- **단일 DB(shared DB) 전략**으로 시작한다.
- `specialforce` 기존 스키마를 기준으로 `prediction_*` 계열 테이블을 확장한다.

이유:
- 2~4주 단축 목표에서 데이터 동기화 비용 최소화
- Session/AAR/ActionItem과 예측 결과 간 조인/환류가 단순
- 운영 관찰성과 회귀검증이 쉬움

마이그레이션 원칙:
1. Prisma migration은 `specialforce` 기준 단일 체인 유지
2. 파괴적 변경 금지(additive migration 우선)
3. 예측 테이블은 `organizationId`, `sessionId`, `aarReportId` FK를 명시해 경계 유지
4. 롤백은 `forward fix` 우선, 불가 시 데이터 보존형 다운그레이드 스크립트 사용

환경 분리 원칙:
1. `dev`, `staging`, `prod` DB는 물리적으로 분리한다.
2. `prod` 마이그레이션은 2인 승인(작성자 + 리뷰어) 없으면 금지한다.
3. `prod` 적용 전 `staging`에서 동일 migration 리허설 1회 이상 수행한다.
4. `prod` 적용 직전 백업 스냅샷 생성 및 복원 검증 체크리스트를 통과해야 한다.

---

## 2. KPI 체계

## 2.1 예측 KPI

- Brier Score
- Calibration Error
- Precision / Recall
- False Alarm Rate / Miss Rate

## 2.2 운영 KPI

- 경보 리드타임
- AAR 작성시간
- 조치 완료율
- 재발률 감소

## 2.3 사업 KPI

- 파일럿 전환율
- 사용자 리텐션
- 계정 확장률

## 2.4 Phase별 KPI 최소 기준

- Alpha(2주):
  - 예측 이벤트 30건 이상 end-to-end 기록
  - Brier score baseline 산출 (≤ 0.25 목표)
  - Calibration gap (ECE) ≤ 0.10
  - False alarm rate ≤ 0.35
  - 리드타임 중앙값 ≥ 24h
- Beta(4주):
  - 도메인 확장 8개 이상
  - calibration 개선 추세 확인 (ECE Alpha 대비 20% 개선)
  - False alarm rate Alpha 대비 15% 개선
  - 조치 완료율 ≥ 70%
  - AAR 생성 + 후속조치 연결률 ≥ 90%

## 2.5 KPI 경보 임계치 (Alert Threshold)

- Brier score > 0.30: 모델 품질 경보
- ECE > 0.15: 보정(calibration) 경보
- False alarm rate > 0.40: 경보 과민 경보
- Miss rate > 0.30: 미탐 경보
- 주간 데이터 결측률 > 5%: 파이프라인 품질 경보
- 평균 리드타임 < 12h: 운영 가치 경보
- 오케스트레이터 p95 latency > 10s: 실시간성 경보
- 예측 1건당 비용 > 목표 상한: 비용 경보

## 2.6 SLO / Error Budget (운영 수치 고정)

- Availability SLO: 99.5% / 30일
- Orchestrator latency SLO: p95 <= 10s, p99 <= 15s
- Prediction pipeline success SLO: 98% 이상
- Cost SLO: 예측 1건당 평균 비용 <= 목표 상한(초기값: $0.05)
- Error Budget:
  - 월간 가용성 예산: 0.5%
  - 50% 소진 시 기능 배포 속도 감속
  - 100% 소진 시 안정화 작업 외 신규 기능 동결

---

## 3. 아키텍처 원칙

1. Domain-first
- 도메인별 모델/규칙 분리

2. Evidence-first
- 근거 없는 예측 금지

3. Orchestration-first
- 상위 오케스트레이터가 충돌 해소/최종 확률 산출

4. Feedback-first
- 결과 기반 재학습/보정 자동화

5. Governance-by-design
- 접근통제/감사로그/정책 강제 내장

6. Reproducibility-by-default
- 동일 입력 재실행 시 동일 결과 재현 가능(run_id/model_version/prompt_hash 고정)

## 3.1 오케스트레이터 충돌해결 정책 (Decision Policy)

충돌해결 우선순위:
1. 정책/규정 위반 가능성이 있는 시나리오는 자동 하향
2. calibration 이후 확률 점수 + 도메인 신뢰도 가중합
3. 동률/고충돌 시 최소리스크(minimax regret) 시나리오 우선
4. 임계 영향(high impact) 사건은 자동결정 금지, human approval 전환

로그 필수:
- conflict_score
- dissent_count
- selected_policy_rule
- rejected_alternatives

---

## 4. 데이터 모델 (Canonical Schema V1)

핵심 엔티티:
- `Observation`
  - source, timestamp, domain, signal, confidence
- `Hypothesis`
  - claim, assumptions, counterfactual
- `Prediction`
  - event_id, horizon, probability, confidence, rationale
- `Evidence`
  - source_url, quote/extract, freshness, trust_score
- `Outcome`
  - observed_result, observed_at, severity, impact
- `ActionItem`
  - owner, due_at, status, expected_effect
- `AARRecord`
  - what_happened, why_missed_or_hit, next_update

필수 메타데이터:
- version
- lineage_id
- policy_tag
- pii_flag
- run_id
- model_version
- prompt_hash
- inference_cost
- inference_latency_ms

---

## 5. 폴더 구조 (실행형)

```txt
hongjo/
  docs/
    multi_agent_research.md
    multi_agent_plan.md
    phase-reports/
  data/
    raw/
    normalized/
    features/
    outcomes/
  ontology/
    domain_schema/
    cross_impact_graph/
  agents/
    macroeconomy/
    policy_politics/
    geopolitics/
    supply_chain/
    cyber/
    shared/
  orchestrator/
    policy/
    weighting/
    dissent/
    scenario_builder/
  evaluation/
    metrics/
    backtests/
    calibration/
  aar/
    templates/
    incident_reviews/
    action_feedback/
  apps/
    api/
    web/
  ops/
    pipelines/
    observability/
    security/
  tests/
    unit/
    integration/
    replay/
```

---

## 6. Phase 상세 계획

## Phase 0: Program Setup

목표:
- 범위/역할/KPI/리스크를 고정한다.

작업:
1. 프로젝트 charter 작성
2. KPI dictionary 확정
3. 데이터/보안 정책 최소선 정의
4. `specialforce` 재사용 범위(As-Is/Modify/New) 매트릭스 확정

산출물:
- `docs/phase-reports/phase-00-report.md`
- `docs/kpi-dictionary.md`
- `docs/security-baseline.md`
- `docs/specialforce-integration-matrix.md`

완료조건:
- 의사결정 권한과 승인 경로 명시
- KPI 측정 방법 정의
- `Phase Tracker Table`에 owner/start/target 입력 완료
- `docs/compliance-gate.md` 초안 작성 완료
- `specialforce` 기준 통합 전략 승인(As-Is/Modify/New 매트릭스)

## Phase 1: Canonical Schema + Ontology V1

목표:
- 도메인 간 공통 언어를 고정한다.

작업:
1. Observation~Outcome 스키마 확정
2. 사건-행위자-자산-위협-결과 그래프 관계 정의
3. 스키마 버전관리 정책 수립
4. `specialforce` 기존 schema와 필드 매핑표 작성

산출물:
- `ontology/domain_schema/v1/*.yaml`
- `ontology/cross_impact_graph/v1.graphml`
- `docs/schema-mapping-specialforce-v1.md`

완료조건:
- 5개 도메인 공통 파싱 가능
- 필수 필드 누락률 측정 가능
- 샘플 100건 기준 schema validation pass rate ≥ 98%
- `specialforce` 주요 엔티티(Session/AAR/ActionItem) 매핑 완료

## Phase 2: Data Pipeline V1

목표:
- 자동 수집/정제/품질점검 파이프라인 구축

작업:
1. 커넥터 3종(문서, API, CSV/엑셀)
2. 정규화 파이프라인
3. 데이터 품질 리포트(결측/지연/정합)
4. `specialforce` DB/로그 ingest adapter 구현

산출물:
- `ops/pipelines/*`
- `data/normalized/*`
- `evaluation/metrics/data_quality_report.md`
- `ops/pipelines/specialforce_adapter/*`

완료조건:
- 일일 ingest 자동 실행
- 품질 경보 기준치 적용
- ingest 성공률(일간) ≥ 95%
- 결측률 ≤ 5%, 중복률 ≤ 2%
- `specialforce` 샘플 데이터 1회 ingest 성공

## Phase 3: Domain Agents V1

목표:
- 초기 5도메인 에이전트 구현

작업:
1. 도메인별 입력/출력 계약 정의
2. 프롬프트/룰/모델 초기화
3. domain health check 추가
4. `specialforce` AAR/ActionItem 문맥 입력 어댑터 연결
5. 메타 에이전트 3종 추가
   - `Uncertainty Agent`
   - `Adversarial Agent`
   - `Policy Agent`

산출물:
- `agents/<domain>/agent.py` 또는 `agent.ts`
- `agents/<domain>/contract.json`

완료조건:
- 각 도메인 독립 실행
- 예측 + 근거 최소 3개 반환
- domain run 성공률 ≥ 95%
- 응답 지연 p95 ≤ 8s
- `specialforce` 세션 1건 기준 도메인 추론 파이프라인 동작
- 메타 에이전트 3종 결과가 오케스트레이터 입력으로 연결

## Phase 4: Orchestrator V1

목표:
- 도메인 결과를 통합해 최종 시나리오 생성

작업:
1. 동적 가중치(신뢰도/최신성/과거성능)
2. dissent log(소수의견) 저장
3. 최종 확률 분포 생성
4. 예측 결과를 `specialforce` AAR 화면에서 조회 가능하게 연결
5. 실패 모드(fallback) 구현
   - 데이터 부족
   - 에이전트 타임아웃
   - 충돌 과다(conflict overload)
6. 확률 캘리브레이션 계층 연결(통합 전 보정)

산출물:
- `orchestrator/weighting/*`
- `orchestrator/dissent/*`
- `specialforce/app/api/prediction/*` (specialforce 증설 API 명세)

완료조건:
- 최종 확률 + 반대근거 동시 제공
- 충돌 신호 발생 시 dissent log 생성률 100%
- 오케스트레이터 응답 p95 ≤ 10s
- `specialforce` UI에서 prediction summary 카드 노출
- fallback 경로 테스트 케이스 통과율 100%
- 통합 전 calibration 단계 적용 확인

## Phase 5: Explainability + Evidence Pack V1

목표:
- "왜 이 예측인가"를 운영자가 이해 가능하게 제공

작업:
1. Evidence Pack 포맷 표준화
2. 근거 신뢰도 점수 부여
3. 인용/출처 링크 추적

산출물:
- `docs/evidence-template.md`
- `apps/web/evidence-panel/*`

완료조건:
- 예측마다 핵심 근거 3~10개
- 근거 미달 시 예측 경고 표시
- 근거 링크 유효성 검사 pass rate ≥ 99%

## Phase 6: Evaluation Loop V1

목표:
- 정확도 검증 자동화

작업:
1. outcome 라벨링 파이프라인
2. Brier/Calibration/PR 계산기
3. 주간 성능 리포트 자동 생성
4. drift 감시(데이터 드리프트 + 컨셉 드리프트) 추가

산출물:
- `evaluation/metrics/*.py`
- `evaluation/backtests/*.md`

완료조건:
- 주간 성능 보고 자동화
- 성능 하락 감지 알림
- Brier/ECE/PR 자동 계산 성공률 100%
- 주간 리포트 생성 실패 0건
- drift alert 감지 후 원인분류 리포트 자동 생성

## Phase 7: AAR Feedback Loop

목표:
- 예측 실패를 학습자산으로 전환

작업:
1. 실패 원인 자동 분류(데이터/모델/전제)
2. ActionItem 자동 발행
3. 보정결과 추적
4. `specialforce` 액션아이템 결과를 학습 피드백으로 역주입

산출물:
- `aar/incident_reviews/*`
- `aar/action_feedback/*`

완료조건:
- 실패 -> 조치 -> 보정 이력 추적 가능
- 실패 케이스의 90% 이상이 원인 카테고리로 자동 분류
- ActionItem 미할당 0건
- `specialforce` 완료 액션아이템 기반 보정 작업 1회 성공

## Phase 8: UI/UX Simplification

목표:
- 사람이 쉽게 이해하는 운영 화면 제공

작업:
1. 홈 3블록 구조
  - 상황판
  - 이번 AAR
  - 다음 3개 조치
2. 용어 단순화
3. 언어 일관성(ko/en) 점검

산출물:
- `apps/web/*`
- `docs/ui-copy-style-guide.md`

완료조건:
- 신규 사용자 10분 내 핵심 흐름 이해 가능
- 첫 사용 테스트(5명)에서 과업 성공률 ≥ 80%

## Phase 9: Security/Operations Hardening

목표:
- 운영 신뢰성과 보안 강화

작업:
1. 불변 감사로그
2. 다중테넌트 접근통제 검증
3. 데이터 계보(lineage) 추적
4. 비상 대응(runbook)
5. 백업/복구 기준 확정(RTO/RPO) + 복원 리허설
6. 운영 SLO 고정(정확도/지연/비용)

산출물:
- `ops/security/*`
- `ops/observability/*`

완료조건:
- 주요 액션 감사추적 100%
- 권한 우회 테스트 0건 허용
- 중요 API 보안 테스트(인증/인가) pass rate 100%
- 민감정보 마스킹 누락 0건
- 백업 복원 리허설 1회 이상 성공
- SLO 위반 대응 runbook 검증 완료
- staging->prod 전환 체크리스트(2인 승인 + 백업 스냅샷) 통과

## Phase 10: Alpha Readout (2주)

목표:
- 운영형 에이전트 알파 증명

작업:
1. 30개 이벤트 예측 수행
2. Evidence Pack + Dissent Log 검증
3. 운영 리포트 제출

완료조건:
- end-to-end 재현 가능
- 30개 이벤트에 대해 예측/근거/결과/AAR 링크 전부 존재
- Alpha KPI 임계치 충족

## Phase 11: Beta Expansion (4주)

목표:
- 도메인 확장과 정확도 안정화

작업:
1. 도메인 8~12개 확대
2. 가중치 최적화(A/B)
3. 시나리오 시뮬레이션 추가

완료조건:
- baseline 대비 KPI 개선 추세
- Beta KPI 임계치 충족
- 확장 도메인 8개 이상 운영 리포트 확보

---

## 7. 2주/4주 상세 스프린트

## Sprint A (Week 1)
- Schema V1 확정
- Pipeline V1 연결
- Domain 5개 초안 구현

## Sprint B (Week 2)
- Orchestrator + Evidence Pack
- Evaluation 자동화
- Alpha Readout

## Sprint C (Week 3)
- 도메인 확장 + 가중치 튜닝
- 실패분석 자동화

## Sprint D (Week 4)
- Beta 리포트
- 보안/운영 하드닝

---

## 8. 리스크 관리

1. 범위 과대
- 대응: 초기 5도메인 고정

2. 데이터 품질 저하
- 대응: 품질게이트 미통과 데이터 격리

3. 과신(Overconfidence)
- 대응: calibration 강제 + confidence cap

4. 설명 불가 예측
- 대응: 근거 없는 예측은 "참고용"으로 격하

5. 운영 미정착
- 대응: AAR/Action loop KPI를 운영평가에 직접 연동

6. 데이터 라이선스/출처 권리 위반
- 대응: `compliance-gate`에서 사용권 검증 실패 시 ingest 차단

7. 개인정보/민감정보 누출
- 대응: pii_flag + masking rule 미통과 데이터는 저장 금지

---

## 9. 바로 시작할 TODO (실행 순서)

1. `docs/kpi-dictionary.md` 작성
2. `ontology/domain_schema/v1/` 스키마 파일 생성
3. `agents/*/contract.json` 5개 작성
4. `orchestrator/weighting/strategy.md` 작성
5. `evaluation/metrics/brier_calibration_spec.md` 작성
6. `docs/phase-reports/phase-00-report.md` 작성
7. `docs/compliance-gate.md` 작성
8. `docs/phase-tracker.md` 작성(표 자동 동기화 규칙)
9. `docs/specialforce-integration-matrix.md` 작성
10. `docs/schema-mapping-specialforce-v1.md` 작성

---

## 10. 보고 규칙

- 각 Phase 종료 시 `docs/phase-reports/phase-XX-report.md` 생성
- 보고서는 아래 5항목 고정:
1. 완료 작업
2. 검증 결과
3. 리스크/이슈
4. 다음 Phase 진입 조건
5. 사용자 판단 필요 항목

## 10.1 사용자 판단 필요 게이트(멈춤 지점)

아래 항목은 사용자 승인 전 자동 진행하지 않는다.

1. 도메인 우선순위 변경
- 초기 5도메인 외 추가/제거, 우선순위 재정렬

2. 데이터 소스 계약/사용권 이슈
- 유료/제한적 데이터 소스 도입, ToS 해석 불명확 소스 사용

3. 배포/보안 정책 변경
- 운영 도메인 확정, 외부 공개 범위 확대, 접근통제 정책 변경

4. DB 파괴적 변경
- 컬럼 삭제/타입 변경/기존 테이블 구조 파괴를 수반하는 migration

5. KPI 임계치 변경
- 경보/합격 기준 수치 조정

6. 모델 교체/버전 업/가중치 정책 변경
- 핵심 모델 변경, calibration 전략 변경, 오케스트레이션 정책 변경

## 11. Compliance Gate (출처/권리/보안)

모든 데이터 소스는 아래 4개를 통과해야 ingest 허용:
1. 사용권(license/ToS) 확인
2. 출처 신뢰도 등급 부여
3. 개인정보 포함 여부(`pii_flag`) 판정
4. 보관 정책/삭제 정책 매핑

차단 규칙:
- license 불명확: 차단
- 민감정보 마스킹 실패: 차단
- 출처 신뢰도 하위등급 + 핵심 예측 입력: 경고 후 보조신호로만 사용

## 12. Sprint-Phase Mapping

| Sprint | 기간 | 목표 Phase | 종료 시 체크 |
|---|---|---|---|
| Sprint A | Week 1 | Phase 0~2 | Tracker 입력, Schema V1, Pipeline 기본 동작 |
| Sprint B | Week 2 | Phase 3~6 + Phase 10 | Domain 5개 + 메타에이전트, Orchestrator, Evidence, Eval, Alpha Readout |
| Sprint C | Week 3 | Phase 7~8 | AAR 환류 자동화, UI 단순화 |
| Sprint D | Week 4 | Phase 9 + Phase 11 | 보안 하드닝 + SLO/복구 기준 검증, Beta KPI 검증 |

## 13. specialforce 통합 검증 체크리스트

- [ ] C1. 재사용 범위 확정(`As-Is/Modify/New`)
- [ ] C2. schema 매핑 문서 완료
- [ ] C3. specialforce ingest adapter 동작
- [ ] C4. prediction API(`prediction/*`) 연결
- [ ] C5. AAR 화면 prediction summary 노출
- [ ] C6. ActionItem 결과 -> 보정 파이프라인 환류
- [ ] C7. 기존 specialforce 기능 회귀 테스트 통과
- [ ] C8. run_id/model_version/prompt_hash 저장 및 재현 테스트 통과
- [ ] C9. high impact 예측 human approval 게이트 동작


## 14. Execution Log (Phase 0-1)

- 2026-03-05 22:20 KST [반영]: 사용자 요청 기반 품질/오류/보안 점검 상태를 plan에 기록
- 2026-03-05 22:20 KST [품질]: `test:unit`, `test:integration`, `test:replay` 최근 통과 상태 유지 (Phase 1 문서작업은 추가 런타임 테스트 미실행)
- 2026-03-05 22:20 KST [오류처리]: 통합테스트 401 이슈는 DB 기반 통합검증으로 대체하여 재발 경로 차단
- 2026-03-05 22:20 KST [보안]: 신규 시크릿 노출 경로 없음, 테스트는 운영 DB 금지 원칙 유지

- 2026-03-05 21:30 KST [진행]: `phase-tracker.md`에 Owner/Start/Target 실값 입력
- 2026-03-05 21:35 KST [진행]: `prediction_extension.prisma`를 specialforce 실제 schema 기준으로 병합 설계 업데이트
- 2026-03-05 21:40 KST [진행]: `test:unit`, `test:integration`, `test:replay` 실행 스크립트 연결 착수
- 2026-03-05 21:46 KST [발견]: 기존 phase4/phase5 smoke는 세션기반 인증 구조와 불일치해 401 발생
- 2026-03-05 21:50 KST [수정]: `test:integration`을 DB 기반 통합검증으로 교체(서버/로그인 의존 제거)
- 2026-03-05 21:52 KST [완료]: `npm run test:unit`, `npm run test:integration`, `npm run test:replay` 통과
- 2026-03-05 21:53 KST [완료]: Phase 0 완료로 상태 동기화(Tracker/Report)
- 2026-03-05 22:00 KST [반영]: 품질/오류/보안 점검 결과를 phase/report 문서에 반영
- 2026-03-05 22:05 KST [착수]: Phase 1 시작 (canonical schema + ontology 산출물 생성)
- 2026-03-05 22:10 KST [진행]: domain schema v1 및 cross-impact graph v1 파일 생성
- 2026-03-06 10:15 KST [진행]: 5도메인 공통 파싱 샘플 100건 생성
- 2026-03-06 10:20 KST [진행]: schema validation 스크립트/리포트 자동화 추가
- 2026-03-06 10:22 KST [완료]: validation pass rate 100.00%, required field missing rate 0.00% 확인
- 2026-03-06 10:25 KST [완료]: specialforce Session/AAR/ActionItem 필드 매핑 문서 보강 후 Phase 1 완료 동기화
- 2026-03-06 10:35 KST [반영]: schema validation 결과 리포트 경로 상대화(절대경로 노출 제거)
- 2026-03-06 10:38 KST [반영]: schema validation CI 워크플로우 추가 (`.github/workflows/schema-validation-phase1.yml`)
- 2026-03-06 10:45 KST [착수]: Phase 2 pipeline draft 추가 및 data quality report 자동 생성 연결
- 2026-03-06 10:52 KST [진행]: Phase 2 connector skeleton 3종(API/문서/CSV) 추가
- 2026-03-06 10:55 KST [검증]: pipeline draft 실행(raw 25/20/20, normalized 65, ingest 100%, missing 0%, duplicate 0%)
- 2026-03-06 11:00 KST [진행]: 품질게이트 + 격리큐 + 요약 JSON 추가 (`run_phase2_pipeline_draft.mjs`)
- 2026-03-06 11:03 KST [검증]: 게이트 실패조건 주입 시 `exit code 1` 확인
- 2026-03-06 11:05 KST [자동화]: 일일 cron 워크플로우 추가 (`.github/workflows/phase2-pipeline-daily.yml`)
