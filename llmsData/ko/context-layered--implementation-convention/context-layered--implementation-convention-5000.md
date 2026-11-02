---
document_id: context-layered--implementation-convention
category: context-layered
source_path: ko/context-layered/implementation-convention.md
character_limit: 5000
last_update: '2026-11-01T14:50:39.006Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 표준 컨벤션

Implementation Playbook 표준 컨벤션 이 문서는 implementation-playbook에서 정리한 구조를 canonical example과 usecase 표면에서 재사용할 수 있도록 고정한 표준 컨벤션입니다. 목표는 “예제가 잘 보이는 것”이 아니라, 복잡한 로직이 늘어나도 같은 방식으로 설계, 구현, 테스트, 문서화할 수 있게 만드는 데 있습니다. 모든 workspace package나 demo에 이 폴더 구조를 강제하지는 않습니다. 버튼·설명·확인 단계를 제거하거나 trigger를 바꾸는 상호작용은 이 컨벤션으로 들어가기 전에 상호작용 의도 계약(IIC)을 기록합니다. IIC에서 구현까지의 흐름으로 의도를 6개 레이어와 증거에 매핑합니다. 언제 이 컨벤션을 쓰는가 다음 조건 중 둘 이상이 보이면 이 컨벤션을 권장합니다. - 입력 검증과 후속 처리 흐름이 분리되어야 한다 - 비동기 단계가 2개 이상 존재한다 - 성공/실패/리셋/재시도 상태가 모두 필요하다 - activity log, analytics, ref focus 같은 side effect가 함께 움직인다 - 문서, 예제, 테스트를 같은 계약으로 묶어야 한다 작은 기능은 business 또는 view 파일 수를 줄일 수 있지만, action handler 등록은 아래 Handler Registry 규칙을 항상 따릅니다. 표준 폴더 구조 레이어별 책임 contexts/ - Action, Store, Ref 경계를 정의한다 - 초기 상태를 둔다 - 상태 타입은 여기서 import해서 조립한다 - 액션 인텐트 도메인 이원화 (No Mixed Payloads): 서버/스토리지 영속성 변이·비즈니스 상태 머신 전이·MCP 도구 호출을 담당하는 BusinessActionIntent와 스플릿 독 개폐·패널 리사이즈·캔버스 줌/팬·탭 전환 등 로컬 뷰포트 크롬만 제어하는 LayoutActionIntent의 페이로드를 혼합하지 않고 분리한다 (통합 트라이어드 자율 동기화 가이드) business/ - 순수 함수만 둔다 - draft 기본값 - validation issue 계산 - 결과 계산 - activity event 정의 - 명시적 상태 전이 함수 문자열 문구, DOM focus, analytics 호출은 넣지 않습니다. > TypeSpec Evidence 연동 (Policy Hopping — ttsc@0.33.1 / @wrtnlabs/evidence@0.8.0): > business/의 순수 검증 및 상태 전이 함수는 TypeSpec SSOT의 런타임 정책 타깃(CA-SPEC-EVIDENCE-001, 통합 트라이어드 자율 동기화 가이드)이 될 수 있습니다. 핵심 비즈니스 로직 함수는 생성된 계약 선언(@evidenceReview ./generated/dto.ts#Policy #hash), 멀티라인 Heading-Form 주석(@evidence, @evidenceReview), 또는 분리형 증명 문서(evidenceFiles: ["evidence//.md"])로 AST 계약을 고정합니다. handlers/ - 최신 store 값을 읽는다 - business 순수 함수를 호출한다 - state machine 전이를 적용한다 - ref focus, scroll, logging 같은 side effect를 조율한다 - 분리 저장 관점(@entityRoot + @aspectOf)을 복원할 때는 Promise.allSettled로 병렬 조회하여 일부 부가 애스펙트 실패 시에도 degraded: true / null 처리와 함께 코어 화면을 블로킹 없이 복원한다 핸들러는 관심사별로 쪼갭니다. - useScenarioDraftHandlers - useScenarioSubmissionHandlers - 필요하면 useScenarioApprovalHandlers, useScenarioSyncHandlers 등으로 분리 단일 handler 기능을 포함한 모든 handler는 도메인 Handler Registry를 통해 등록합니다. Page, View, Context 파일은 Registry를 마운트·조합만 하며 useActionHandler를 직접 호출하지 않습니다. actions/ - view가 쓰는 dispatch helper만 둔다 - payload shaping 정도만 허용한다 hooks/ - store 구독 - view 전용 파생값 계산 - state machine 상태를 화면용 label/message로 해석 views/ - 렌더링과 입력 전달만 담당한다 - validation 규칙, quote 계산, 상태 전이 로직을 직접 품지 않는다 - 복합 워크스페이스 화면은 6-Level 레이아웃 위계(L1 app-shell $\to$ 병렬 형제 L2 page-canvas & L3 dock-panel $\to$ L4 slot-panel $\to$ L5 section-card $\to$ L6 floating-overlay), 2대 황금률(컴포넌트 슬롯 분리 및 뷰포트 기하 변환 격리), 4-Tier 시맨틱 Z-Index(--z-base: 1 --z-toast: 1100, 매직 넘버 금지)를 준수한다 > 프레젠테이션 상태 면제 (Tier 3 Presentation Waiver & 파일 상단 @evidenceExclude): > 모달 열림/닫힘(isOpen), 드롭다운 포커스, 탭 인덱스 등 화면 표출 전용 상태는 TypeSpec 모델링 및 Evidence 추적 대상에서 공식 제외됩니다. 컴포넌트 로컬 상태(useState)나 ref Context를 사용하며, views/ 파일 상단에 @evidenceExclude를 선언하여 파일 내 모든

Key points:
• 입력 검증과 후속 처리 흐름이 분리되어야 한다
• 비동기 단계가 2개 이상 존재한다
• 성공/실패/리셋/재시도 상태가 모두 필요하다
• activity log, analytics, ref focus 같은 side effect가 함께 움직인다
• 문서, 예제, 테스트를 같은 계약으로 묶어야 한다
• Action, Store, Ref 경계를 정의한다
• 초기 상태를 둔다
• 상태 타입은 여기서 import해서 조립한다
• **액션 인텐트 도메인 이원화 (`No Mixed Payloads`)**: 서버/스토리지 영속성 변이·비즈니스 상태 머신 전이·MCP 도구 호출을 담당하는 `BusinessActionIntent`와 스플릿 독 개폐·패널 리사이즈·캔버스 줌/팬·탭 전환 등 로컬 뷰포트 크롬만 제어하는 `LayoutActionIntent`의 페이로드를 혼합하지 않고 분리한다 ([통합 트라이어드 자율 동기화 가이드](./triad-evidence-sync-guide.md))
• 순수 함수만 둔다
• draft 기본값
• validation issue 계산
• 결과 계산
• activity event 정의
• 명시적 상태 전이 함수
• 최신 store 값을 읽는다
• `business` 순수 함수를 호출한다
• state machine 전이를 적용한다
• ref focus, scroll, logging 같은 side effect를 조율한다
• 분리 저장 관점(`@entityRoot` + `@aspectOf`)을 복원할 때는 `Promise.allSettled`로 병렬 조회하여 일부 부가 애스펙트 실패 시에도 `degraded: true` / `null` 처리와 함께 코어 화면을 블로킹 없이 복원한다
• `useScenarioDraftHandlers`
• `useScenarioSubmissionHandlers`
• 필요하면 `useScenarioApprovalHandlers`, `useScenarioSyncHandlers` 등으로 분리
• view가 쓰는 dispatch helper만 둔다
• payload shaping 정도만 허용한다
• store 구독
• view 전용 파생값 계산
• state machine 상태를 화면용 label/message로 해석
• 렌더링과 입력 전달만 담당한다
• validation 규칙, quote 계산, 상태 전이 로직을 직접 품지 않는다
• 복합 워크스페이스 화면은 **6-Level 레이아웃 위계**(`L1 app-shell` $\to$ 병렬 형제 `L2 page-canvas` & `L3 dock-panel` $\to$ `L4 slot-panel` $\to$ `L5 section-card` $\to$ `L6 floating-overlay`), **2대 황금률**(컴포넌트 슬롯 분리 및 뷰포트 기하 변환 격리), **4-Tier 시맨틱 Z-Index**(`--z-base: 1` ~ `--z-toast: 1100`, 매직 넘버 금지)를 준수한다
• `contexts/` 파일은 `Context` 또는 `Contexts`로 끝납니다.
• `business/` 파일은 lower-camel 또는 kebab-case로 이름 짓고 React와
• `handlers/` 파일은 `*HandlerRegistry`, `*Handlers`, `*HandlerSupport`,
• `actions/` 파일은 `*Actions` 또는 `*ActionHandlers`로 이름 짓습니다.
• `hooks/` 파일은 `use*` 명명을 사용하며 `index`, `types` 진입점을
• `views/` 파일은 `*View`, `*Views` 또는 `*Grid` 같은 명시적...