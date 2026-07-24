---
document_id: context-layered--usecase-recipe-profile
category: context-layered
source_path: ko/context-layered/usecase-recipe-profile.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.444Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Usecase 및 Recipe Profile

Context-Layered Usecase 및 Recipe Profile 기존 6-layer 구조는 내부 runtime 아키텍처로 유지합니다. 이 profile은 runtime을 디자인 시스템 기반 product UI에 연결하기 위한 공개 경계를 추가합니다. 위치 Context-Layered Architecture는 상위 개념으로 유지합니다. Usecase Boundary, Facade, Recipe는 새로운 경쟁 아키텍처가 아니라 기존 구조 안의 공개 경계입니다. 왜 필요한가 기존 6-layer는 실행 흐름은 설명하지만 product UI와 연결되는 경계를 충분히 설명하지 못했습니다. - actions와 hooks가 의도치 않게 공개 API가 될 수 있습니다. - views가 순수 표현과 제품 조합을 함께 포함할 수 있습니다. - Astryx primitive가 domain state나 context-action에 직접 결합될 수 있습니다. | 경계 | 소유하는 것 | 소유하지 않는 것 | | --- | --- | --- | | Domain business | 순수 검증, 계산, 상태 전이 | React, store, UI 문구 | | Runtime | Context, handler, dispatch, subscription | Astryx component | | Facade | 안정적인 command와 view model | layout과 시각 정책 | | Recipe | Astryx 조합과 prop 연결 | domain rule과 raw dispatch | | Product scope | Provider, registry, route, 외부 데이터 | 개별 handler 구현 | 권장 feature 구조 기존 기능은 6-layer 폴더를 유지하면서 facade와 recipes를 추가합니다. 신규 기능은 runtime을 묶어도 됩니다. Facade 컨벤션 Facade는 feature runtime의 유일한 공개 React API입니다. 규칙: - 상태는 명사, command는 동사로 이름을 짓습니다. - handler ID, store manager, raw dispatch를 노출하지 않습니다. - isOpen, isBusy, canSubmit 같은 파생 값은 facade에서 계산합니다. - async result, abort, retry, error 변환도 facade 안에 둡니다. 권장 이름: Recipe 컨벤션 Recipe는 facade view model을 Astryx controlled prop으로 변환합니다. 규칙: - 디자인 시스템 primitive와 feature facade만 import합니다. - isOpen, value, isLoading, status 같은 controlled 계약을 유지합니다. - focus, ARIA, keyboard, intrinsic interaction은 primitive가 소유합니다. - primitive에서 context-action을 직접 import하지 않습니다. - JSX에 validation이나 business transition을 작성하지 않습니다. Ref 마운트 관찰 usecase 프레임워크 pattern 데모에서 DOM 경계를 관찰해야 할 때는 DOM node 자체를 애플리케이션 state로 만들지 않습니다. ref context는 등록과 mount lifecycle을, store는 파생 관찰값을, action은 사용자 의도를 소유하도록 분리합니다. useRefMountState 데모를 이 경우의 기준 recipe로 사용합니다. - contexts/가 action, store, ref 계약을 소유합니다. - business/에는 렌더 카운트 증가 같은 순수 전이 함수를 둡니다. - handlers/만 useActionHandler를 등록합니다. - actions/는 resetRenderCounts 같은 의미 기반 command를 공개합니다. - view는 useRefMountState와 useStoreValue로 읽고 store를 직접 변경하지 않습니다. mount callback은 필요한 범위의 DOM 동기화만 수행할 수 있지만, 두 번째 state 관리 채널이 되어서는 안 됩니다. 관찰값을 화면에 표시해야 한다면 intent를 dispatch하고 렌더링 값은 Store Context에 유지합니다. 도메인은 Action → Store → Ref → Handler Registry → View 순서로 조합합니다. Priority pipeline usecase 검증, 정책, business 작업, 관찰 로직을 하나의 action 아래 순서대로 실행해야 할 때 priority pipeline을 사용합니다. 실행 순서는 하나의 Handler Registry에 명시적으로 둡니다. 각 등록에는 안정적인 handler ID와 문서화된 priority를 지정합니다. blocking 단계는 controller로 abort하여 이후 단계를 막고, 이후 단계의 결과는 page의 React local state를 캡처하지 않고 Store Context를 통해 기록합니다. 이렇게 하면 실행 trace를 관찰할 수 있고 page component를 읽지 않아도 priority 설정을 검토할 수 있습니다. Action 및 Handler 이름 Action은 저장소 mutation이 아니라 사용자 의도를 표현합니다. Handler ID는 feature, action, stage를 포함합니다. 권장 priority band: | Priority | 단계 | Blocking | | ---: | --- | --- | | 100 | Contract 및 입력 검증

Key points:
• `actions`와 `hooks`가 의도치 않게 공개 API가 될 수 있습니다.
• `views`가 순수 표현과 제품 조합을 함께 포함할 수 있습니다.
• Astryx primitive가 domain state나 `context-action`에 직접 결합될 수 있습니다.
• 상태는 명사, command는 동사로 이름을 짓습니다.
• handler ID, store manager, raw `dispatch`를 노출하지 않습니다.
• `isOpen`, `isBusy`, `canSubmit` 같은 파생 값은 facade에서 계산합니다.
• async result, abort, retry, error 변환도 facade 안에 둡니다.
• 디자인 시스템 primitive와 feature facade만 import합니다.
• `isOpen`, `value`, `isLoading`, `status` 같은 controlled 계약을 유지합니다.
• focus, ARIA, keyboard, intrinsic interaction은 primitive가 소유합니다.
• primitive에서 `context-action`을 직접 import하지 않습니다.
• JSX에 validation이나 business transition을 작성하지 않습니다.
• `contexts/`가 action, store, ref 계약을 소유합니다.
• `business/`에는 렌더 카운트 증가 같은 순수 전이 함수를 둡니다.
• `handlers/`만 `use*ActionHandler`를 등록합니다.
• `actions/`는 `resetRenderCounts` 같은 의미 기반 command를 공개합니다.
• view는 `useRefMountState`와 `useStoreValue`로 읽고 store를 직접 변경하지 않습니다.
• `components/priority/business/priority-demo-rules.ts`가 중복 검사, priority
• `contexts/PriorityDemoContexts.tsx`가 Action·Store 계약을 정의하고 등록 목록,
• `actions/usePriorityDemoActions.ts`는 Store mutation을 View에 노출하지 않고
• `handlers/PriorityDemoHandlerRegistry.tsx`가 순서가 있는 비동기 실행, 단계별
• `business/comparison-rules.ts`가 counter, calculation, heavy-data,
• `handlers/ComparisonHandlerRegistry.tsx`가 두 action lane과 performance
• `actions/useComparisonActions.ts`는 widget에 안정적인 command를 제공하고,
• 기존 component와 handler hook은 compatibility re-export/status hook으로
• `createObjectContextHooks`가 Action·Store·Manager 계약과 호환 public hook을
• `handlers/ObjectContextHandlerRegistry.tsx`가 lifecycle, selection, focus,
• `ObjectContextManager`가 도메인 lifecycle 동작을 소유하며, public `dispatch`
• `contexts/`가 Store, Action, Ref 계약을 소유합니다.
• ViewModel hook은 Store 접근이 주입된 handler 구현을 반환하지만 action을
•...