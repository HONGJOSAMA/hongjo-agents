# Multi-Agent Research for Situation Forecasting

작성일: 2026-03-05  
작성자: Codex 협업 노트

## 1) 연구 목적

본 문서는 "도메인 에이전트 + 상위 오케스트레이터" 구조로 상황을 예측하고, 예측의 성공/실패를 다시 학습하여 정확도를 개선하는 운영체계를 설계하기 위한 연구 정리다.

핵심 목표:
- 도메인별 전문성(경제, 정치, 지리, 공급망, 안보 등)을 유지하면서
- 상호작용(경제-정치-지리 결합 효과)을 통합 판단하고
- 관찰 -> 평가 -> 후속조치 -> 결과검증 -> 보정 루프를 자동화한다.

---

## 2) 대화 기반 요구사항 정리 (우리 대화 반영)

이번 대화에서 합의된 핵심 요구:
1. 단일 모델이 아닌 "도메인 에이전트들의 토의 + 근거 기반" 예측이 필요하다.
2. 예측 결과는 반드시 사후 검증되고, 정확도 지표로 추적되어야 한다.
3. 실패 사례를 AAR(After Action Review) 루프로 환류해 모델/규칙/가중치를 보정해야 한다.
4. 1년 단위가 아니라 2주~1달 내 가시적 성과가 나오는 계획이 필요하다.
5. 사람이 쉽게 이해 가능한 구조(혼합 언어/복잡한 흐름 최소화)가 중요하다.
6. 장기 비전은 "세상 모든 일 예측"이지만 초기에는 고우선 도메인부터 단계적으로 확장해야 한다.

해석:
- 비전은 범용 예측 플랫폼이지만, 실행은 "도메인 분할 + 오케스트레이션 + 계량 검증"으로 가야 성공확률이 높다.

---

## 3) 왜 단일 에이전트보다 멀티 에이전트가 유리한가

### 3.1 단일 에이전트 한계
- 도메인별 신호 품질과 지표 체계가 달라 평균화 오류 발생
- 설명가능성 저하(왜 그런 결론인지 근거 분해 어려움)
- 업데이트 시 전체 회귀 리스크 증가

### 3.2 멀티 에이전트 장점
- 도메인 전문 모델을 독립 개선 가능(교체 비용 낮음)
- 충돌/불일치 자체가 중요한 신호(리스크 상승, 불확실성 증가)
- 오케스트레이터에서 가중치/신뢰도 조정 가능
- 감사/규제 대응 시 추적성(누가 어떤 근거로 어떤 예측을 냈는지) 확보

결론:
- "전문 에이전트 연합 + 상위 오케스트레이터"가 실전 운영에서 정확도/설명가능성/유지보수 균형이 가장 좋다.

---

## 4) Domain Agents 추천 목록 (초기 5 + 확장형)

## 4.1 초기 5개(2~4주 가속 구간)
1. 거시경제 Agent
- 입력: 금리, 물가, 실업, 성장률, 통화정책 발언
- 출력: 경기국면, 정책변화 확률, 변동성 리스크

2. 정치/정책 Agent
- 입력: 선거, 법안, 제재, 외교 이벤트, 정부 발표
- 출력: 정책변화 확률, 규제충격 지수

3. 지정학/안보 Agent
- 입력: 분쟁 이벤트, 군사훈련, 제재 네트워크, 외교관계
- 출력: 지역 긴장도, 충돌확률, 공급망 충격 가능성

4. 공급망/무역 Agent
- 입력: 물류지표, 항만/운송 지연, 관세/수출통제, 원자재 흐름
- 출력: 병목 위험도, 리드타임 악화 확률

5. 사이버/정보위협 Agent
- 입력: 침해사고 신호, 취약점 공지, 캠페인 패턴
- 출력: 공격 가능성, 운영중단 가능성, 우선 패치 영역

## 4.2 확장 12개(+)
- 금융시장
- 에너지/자원
- 기술/산업
- 사회여론/정보전
- 기후/재난
- 보건/인구/노동
- 법률/규제 집행
- 도시/인프라
- 식량/농업
- 교육/인재
- 공공재정
- 국방 운영(훈련/AAR/전투준비)

---

## 5) 상위 오케스트레이터 설계

## 5.1 역할
- 각 Domain Agent 예측 수집
- 상충 신호 탐지 (예: 경제는 안정, 지정학은 급격 악화)
- 신뢰도/데이터 최신성/과거 성능 기반 동적 가중치 부여
- 최종 시나리오(낙관/기준/비관)와 확률 분포 생성
- 후속조치(Action Items) 자동 추천

## 5.2 출력 포맷(권장)
- Final Forecast
  - event_id, horizon, probability, confidence
- Evidence Pack
  - 핵심 근거 3~10개, 출처, 최신성, 충돌 여부
- Dissent Log
  - 소수 의견(반대 시나리오) 및 반대 근거
- Action Plan
  - 즉시 조치 / 관찰 강화 / 보류 항목

## 5.3 실패 대응
- 예측 실패 시 "무엇이 틀렸는지"를 다음 3축으로 분해
  1) 데이터 누락/지연
  2) 모델 편향/가중치 오류
  3) 전제(assumption) 붕괴

---

## 6) 운영 루프 (AAR 내장형)

1. Observation
- 다원 데이터 수집 + 정규화 + 신뢰도 점수화

2. Assessment
- 도메인별 예측 + 오케스트레이터 통합

3. Action
- 실행 가능한 후속조치 발행(우선순위, 담당, 기한)

4. Review (AAR)
- 결과 발생 후 예측 정확도 측정 (Brier/Calibration/PR)

5. Adjustment
- 규칙/가중치/프롬프트/모델 버전 업데이트
- 다음 사이클에서 자동 반영

핵심 원칙:
- "예측만"이 아니라 "예측 -> 실행 -> 결과 -> 학습"을 닫아야 성능이 오른다.

---

## 7) 정확도 측정 프레임워크

필수 지표:
- Brier Score: 확률예측 품질
- Calibration Error: 0.7 확률을 준 사건이 실제 70% 발생하는지
- Precision/Recall: 경보형 시나리오 품질
- False Alarm Rate / Miss Rate
- Decision Utility: 예측이 실제 의사결정 개선에 기여했는지

운영 지표:
- 리드타임(사건 전 경고시간)
- 조치 이행률
- 재발률 감소

리더십 보고 지표:
- "정확도" + "경제적/운영적 손실 회피"를 함께 제시

---

## 8) 사례 연구 (도메인 연합/오케스트레이션 관점)

주의: 아래 사례는 "완전 동일한 멀티 에이전트 제품"이 아니라, 다중 모델/다중 소스 통합 + 집계 의사결정 + 성능 검증 루프를 실운영한 대표 참조사례다.

### 사례 A. CDC FluSight Ensemble (보건 예측)
핵심:
- 여러 모델팀의 예측을 앙상블로 결합
- CDC 공식 커뮤니케이션에 사용
- 평가 리포트로 성능을 시즌 단위 추적

시사점:
- 도메인 에이전트(개별 팀 모델) + 상위 집계(ensemble) 구조가 실무에서 강함
- 단일 모델보다 안정적이며, 운영 설명성이 높음

출처:
- CDC FluSight 운영/평가
  - https://www.cdc.gov/flu-forecasting/data-vis/03262025-flu-forecasts.html
  - https://www.cdc.gov/flu-forecasting/evaluation/2024-2025-report.html

### 사례 B. COVID-19 Forecast Hub + CDC 사용 (공중보건)
핵심:
- 다수 팀 예측을 주간 앙상블로 결합
- 단순 평균 -> 중앙값 -> 성능가중 방식으로 진화
- 명시적 성능지표(WIS 등) 기반 구성모델 가중치 조정

시사점:
- 오케스트레이터는 고정 규칙이 아니라 성능 기반으로 진화해야 함
- "모델 다양성 + 동적 가중치"가 장기 정확도에 유리

출처:
- https://covid19forecasthub.org/doc/
- https://covid19forecasthub.org/doc/ensemble/

### 사례 C. ECMWF Ensemble Prediction System (기상)
핵심:
- 단일 deterministic 예측이 아닌 Ensemble Prediction System(EPS) 운영
- 초기 perturbation/비선형 전개로 불확실성 분포를 계산
- 오랜 기간 문서화/검증된 표준 운영 체계 보유

시사점:
- 확률 분포 예측과 불확실성 표현은 고신뢰 예측 시스템의 필수
- "하나의 답"보다 "시나리오 분포"를 주는 것이 운영적으로 유리

출처:
- https://www.ecmwf.int/en/publications/ifs-documentation
- https://www.ecmwf.int/en/elibrary/81627-ifs-documentation-cy49r1-part-v-ensemble-prediction-system

### 사례 D. IARPA ACE / Good Judgment (지정학 예측)
핵심:
- 예측 대회에서 개별 예측보다 집계(aggregation) 전략이 높은 정확도
- 역사 성능이 좋은 예측자 집합의 평균/집계가 유효
- 데이터셋 공개로 재현성과 연구 확장 지원

시사점:
- 도메인 에이전트의 "트랙 레코드"를 저장하고 가중치에 반영해야 함
- 사람+모델 혼합 구조(human-in-the-loop)가 강력할 수 있음

출처:
- https://www.iarpa.gov/newsroom/article/iarpa-announces-publication-of-data-from-the-good-judgment-project
- https://www.citizenscience.gov/ace-forecasting/

### 사례 E. NHS Federated Data Platform (운영 의사결정)
핵심:
- 다기관 데이터 통합 후 운영 지표 개선(수술 처리량, 대기관리 등) 공개
- 데이터 통합/가시화/운영 지휘체계 결합

시사점:
- 예측 시스템도 결국 운영성과로 증명되어야 함
- "예측 정확도"만이 아니라 "현장 성과 개선"을 같이 측정해야 함

출처:
- https://www.england.nhs.uk/digitaltechnology/nhs-federated-data-platform/
- https://www.england.nhs.uk/digitaltechnology/nhs-federated-data-platform/impact/fdp-uptake-and-benefits/
- https://www.england.nhs.uk/2024/11/millions-of-patients-benefitting-from-improved-care-as-new-nhs-it-software-rolled-out/

### 사례 F. Army Vantage (대규모 다도메인 통합)
핵심:
- 다양한 Army 도메인 데이터(readiness/personnel/finance 등)를 통합
- 대규모 사용자 기반에서 의사결정 지원 운영

시사점:
- 도메인 간 연결과 정책 기반 거버넌스가 플랫폼 확장의 핵심
- 예측/권고 체계는 결국 데이터 표준화와 권한 통제 위에서만 신뢰 확보

출처:
- https://www.palantir.com/assets/xrfr7uokpv1b/3NBs70BziuX6uImHrjI8kF/c2d990e44400106f631d7fbcd8f3e1e7/Army_Vantage_Fact_Sheet_.pdf

---

## 9) 추천 오픈소스/오픈웨이트 모델 전략

원칙:
- 단일 LLM로 전부 처리하지 않는다.
- 역할별 모델(요약/추론/정량/탐지)을 분리한다.

권장 구성(예시):
- Orchestrator reasoning: Qwen3 / Llama 계열
- 정량 예측(시계열): XGBoost, LightGBM, Prophet, TFT
- 그래프 추론: PyG 기반 GNN
- RAG 근거검색: hybrid 검색(BM25 + dense)

모델 선정 기준:
- 정확도보다 먼저 추적성/재현성/비용/지연시간/보안 준수

---

## 10) 연구해야 할 정보(Backlog)

### 10.1 데이터 계층
- 이벤트 데이터(정형)
- 문서/뉴스/보고서(비정형)
- 지리/정책/경제 시계열
- 내부 운영로그(AAR, Action Item 결과)

### 10.2 메타데이터
- 출처 신뢰도
- 관측시각/지연
- 버전/스키마 이력
- 데이터 품질 점수

### 10.3 모델/평가
- 도메인별 기준선 모델
- 오케스트레이터 가중치 전략
- 캘리브레이션 방법(Platt, isotonic)
- 드리프트 탐지/재학습 트리거

### 10.4 거버넌스
- 권한/감사로그/정책강제
- 설명가능성 표준 템플릿
- 민감정보 마스킹/규제 준수 체크

---

## 11) 프로젝트 폴더 구조(권장)

```txt
hongjo/
  docs/
    multi_agent_research.md
    multi_agent_plan.md
    adr/
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

## 12) 실행 순서 (2주 / 4주)

## 12.1 2주 알파
1. 이벤트 스키마 + Evidence 스키마 확정
2. 초기 5개 Domain Agent 프롬프트/룰 기반 구현
3. 오케스트레이터 v1(가중 평균 + 반대의견 로그)
4. 대시보드: 확률 + 근거 + 불확실성 표시
5. AAR 루프 연결(성공/실패 라벨링)

완료조건(Alpha DoD):
- 최소 30개 이벤트에 대해 예측/근거/결과가 end-to-end 저장
- Brier/Calibration 리포트 자동 출력

## 12.2 4주 베타
1. 도메인 8~12개 확장
2. 모델 기반 가중치 최적화(성능 이력 반영)
3. 시나리오(낙관/기준/비관) 생성 자동화
4. 조치 추천 정교화(비용/효과/시간 반영)

완료조건(Beta DoD):
- 재현 가능한 백테스트 리포트
- 주간 운영 리포트(정확도, 오탐, 시행착오, 개선효과)

---

## 13) 리스크와 대응

리스크:
1. "세상 모든 것" 목표로 범위를 너무 크게 잡아 초기 실패
2. 데이터 품질 미흡으로 모델 환각/과신
3. 높은 정확도 주장 대비 근거 부족
4. 예측은 되지만 실행(Action) 연결 실패

대응:
- 초기 5도메인 고정 + 단계적 확장
- 근거 없는 예측은 점수 하향/경고
- 모든 예측에 confidence + dissent + evidence 필수화
- 액션아이템과 결과측정을 KPI로 강제

---

## 14) 결론

현재 구조(도메인 에이전트 + 오케스트레이터 + AAR 루프)는 장기 비전("범용 상황예측")으로 가기 위한 올바른 초석이다.

핵심 성공조건은 다음 3가지다:
1. 모델 성능보다 데이터/근거/검증 체계를 먼저 고정할 것
2. 단일 정답 대신 확률 분포와 반대 시나리오를 함께 운영할 것
3. 예측 성공/실패를 행동(Action)과 연결해 학습 루프를 닫을 것

---

## 15) 현재 MVP 진단: 강점과 격차(명시 버전)

### 15.1 현재 강점(이미 확보)
- 운영 루프가 닫혀 있음: 기록 -> 평가 -> AAR -> 액션아이템
- 권한/조직 경계/감사흐름의 기본 틀 보유
- 실제 현장 워크플로우를 코드로 고정한 상태

### 15.2 팔란티어급과의 핵심 격차(필수 보강 5개)
1. 데이터 자동수집 부족(수기 입력 비중 높음)
2. 시계열/이력 기반 예측 모델 부재
3. 지식그래프(온톨로지)와 추론 엔진 미약
4. 운영 의사결정 자동추천(Next Best Action) 부족
5. 관측/검증(MLOps, Drift, Explainability) 체계 부족

---

## 16) 발전 방향 8축(실행 우선순위 고정)

1. 데이터 통합 레이어 구축
- 로그, 문서, 엑셀, 센서, 외부 API를 표준 이벤트 스키마로 수집

2. 온톨로지/그래프 강화
- 사건-행위자-자산-위협-의사결정-결과를 그래프로 연결

3. 시계열 예측 엔진
- 위험 발생확률, 실패 재발확률, 지연확률 예측 모델 도입

4. 근거 기반 설명(Explainable AI)
- 예측 근거 이벤트/히스토리/유사사례를 함께 제시

5. 상황형 에이전트 오케스트레이션
- 플레이북 + 모델 + 규칙엔진 조합으로 상황별 에이전트화

6. 시뮬레이션/가상훈련
- what-if(인력 부족/통신 지연/야간 조건 등) 자동 평가

7. 운영 신뢰성/보안 고도화
- 불변 감사로그, 다중테넌트 보안, 데이터 계보, 정책 기반 접근통제

8. 학습 루프 자동화
- 액션아이템 결과를 다음 모델 학습/평가기준 업데이트로 자동 환류

---

## 17) 실행 로드맵: 압축형(2~4주) + 표준형(0~12개월)

### 17.1 압축형(2주~1달)
- 2주: Rule-based 운영 에이전트(체크리스트 입력, 자동 AAR 초안, 우선조치 추천, 경보룰)
- 4주: 초기 예측 에이전트(재발/지연/실패 위험점수 + 근거 3줄)

주의:
- 2~4주 내 가능 범위는 \"운영형 에이전트 알파 + 초기 예측\"이며, 팔란티어급 신뢰도 완성형은 아님.

### 17.2 표준형(0~12개월)
1) 0~3개월: 데이터 기반 전환
- 자동 수집 파이프라인, 이벤트 표준화, 품질지표(결측/지연/정합) 구축

2) 3~6개월: 예측 MVP
- 재발위험/우선순위 추천 모델 2~3개 도입, A/B 검증 시작

3) 6~12개월: 에이전트화
- 상황형 플레이북 에이전트, 근거설명 UI, 시뮬레이션, MLOps 체계 완성

---

## 18) KPI 체계(예측/운영/사업)

예측 KPI:
- Precision/Recall
- Calibration
- False alarm rate
- Brier score

운영 KPI:
- AAR 작성시간
- 조치 완료율
- 재발률 감소
- 경보 리드타임

사업 KPI:
- 파일럿 전환율
- 사용자 리텐션
- 계정 확장률

원칙:
- 예측 KPI만 보면 실패한다. 반드시 운영 KPI/사업 KPI와 함께 본다.

---

## 19) 오픈소스/오픈웨이트 모델 상세(추천 + 역할)

1. Qwen3 (orchestrator 추론)
- 역할: 상위 통합 추론, 긴 문맥 토의 정리
- 링크: https://github.com/QwenLM/Qwen3

2. DeepSeek-R1 (고난도 추론)
- 역할: 복합 시나리오 해석, 반대가설 생성
- 링크: https://huggingface.co/deepseek-ai/DeepSeek-R1

3. Llama 3.3 70B Instruct (엔터프라이즈 베이스라인)
- 역할: 안정적 범용 지시 추론
- 링크: https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct

4. Mistral/Ministral (효율/경량 운영)
- 역할: 저지연 실무 에이전트, 비용 최적화
- 링크:
  - https://docs.mistral.ai/getting-started/models/weights/
  - https://docs.mistral.ai/models/ministral-3-14b-25-12

5. Phi-4 (경량 전문 태스크)
- 역할: 규칙형 분류, 수학/코딩 보조
- 링크: https://www.microsoft.com/en-us/research/publication/phi-4-technical-report/

선정 원칙:
- 단일 모델 고집 금지
- 도메인별 역할 분리 + 성능기록 기반 라우팅

---

## 20) 대화 결정 로그(요약이 아닌 흐름 기록)

이 섹션은 사용자-시스템 합의가 어떻게 형성됐는지 추적하기 위한 실행 로그다.

1. 사용자 목표 선언
- \"세상 모든 일을 예측하고 싶다\"
- \"도메인 에이전트 토의와 근거 기반 통합 예측이 필요\"

2. 구조 합의
- 단일 초거대 에이전트보다 \"전문 에이전트 + 오케스트레이터\"가 타당
- 이유: 정확도/설명가능성/유지보수/확장성

3. 기간 합의
- 1년은 길고 2주~1달 가속 요구
- 합의: 2주(운영 자동화), 4주(초기 예측), 장기 고도화 분리

4. 운영 방식 합의
- 관찰 -> 평가 -> 후속조치 -> 결과검증 -> 보정 루프 고정
- 성공/실패를 정량화해 모델/규칙/가중치 업데이트

5. 문서/산출물 합의
- 기존 plan과 분리된 별도 멀티에이전트 계획 문서 필요
- 연구 문서에 실제 사례, 도메인 목록, 폴더 구조, 실행 순서를 포함

6. 현재 판단
- 지금 시스템은 \"좋은 초석\"이며, 팔란티어급은 아님
- 다음 핵심: 데이터 자동유입 + 예측 + 근거설명 + 운영 자동화

---

## 21) 참고 소스(최신 교차검증)

- CDC FluSight 2024-2025 Evaluation (2025-09-16)
  - https://www.cdc.gov/flu-forecasting/evaluation/2024-2025-report.html
- COVID-19 Forecast Hub documentation
  - https://covid19forecasthub.org/doc/
  - https://covid19forecasthub.org/doc/ensemble/
- ECMWF IFS Documentation (Part V: Ensemble Prediction System)
  - https://www.ecmwf.int/en/publications/ifs-documentation
- IARPA Good Judgment data publication
  - https://www.iarpa.gov/newsroom/article/iarpa-announces-publication-of-data-from-the-good-judgment-project
- NHS FDP
  - https://www.england.nhs.uk/digitaltechnology/nhs-federated-data-platform/
  - https://www.england.nhs.uk/digitaltechnology/nhs-federated-data-platform/impact/fdp-uptake-and-benefits/
  - https://www.england.nhs.uk/2024/11/millions-of-patients-benefitting-from-improved-care-as-new-nhs-it-software-rolled-out/
- Google SRE Postmortem/Incident Management
  - https://sre.google/workbook/postmortem-culture/
  - https://sre.google/resources/practices-and-processes/incident-management-guide/
- Army Vantage Fact Sheet (Palantir)
  - https://www.palantir.com/assets/xrfr7uokpv1b/3NBs70BziuX6uImHrjI8kF/c2d990e44400106f631d7fbcd8f3e1e7/Army_Vantage_Fact_Sheet_.pdf
