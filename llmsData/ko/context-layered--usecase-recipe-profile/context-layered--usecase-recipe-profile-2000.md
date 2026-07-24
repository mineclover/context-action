---
document_id: context-layered--usecase-recipe-profile
category: context-layered
source_path: ko/context-layered/usecase-recipe-profile.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.443Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Usecase 및 Recipe Profile

Context-Layered Usecase 및 Recipe Profile 기존 6-layer 구조는 내부 runtime 아키텍처로 유지합니다. 이 profile은 runtime을 디자인 시스템 기반 product UI에 연결하기 위한 공개 경계를 추가합니다. 위치 Context-Layered Architecture는 상위 개념으로 유지합니다. Usecase Boundary, Facade, Recipe는 새로운 경쟁 아키텍처가 아니라 기존 구조 안의 공개 경계입니다. 왜 필요한가 기존 6-layer는 실행 흐름은 설명하지만 product UI와 연결되는 경계를 충분히 설명하지 못했습니다. - actions와 hooks가 의도치 않게 공개 API가 될 수 있습니다. - views가 순수 표현과 제품 조합을 함께 포함할 수 있습니다. - Astryx primitive가 domain state나 context-action에 직접 결합될 수 있습니다. | 경계 | 소유하는 것 | 소유하지 않는 것 | | --- | --- | --- | | Domain business | 순수 검증, 계산, 상태 전이 | React, store, UI 문구 | | Runtime | Context, handler, dispatch, subscription | Astryx component | | Facade | 안정적인 command와 view model | layout과 시각 정책 | | Recipe | Astryx 조합과 prop 연결 | domain rule과 raw dispatch | | Product scope | Provider, registry, route, 외부 데이터 | 개별 handler 구현 | 권장 feature 구조 기존 기능은 6-layer 폴더를 유지하면서 facade와 recipes를 추가합니다. 신규 기능은 runtime을 묶어도 됩니다. Facade 컨벤션 Facade는 feature runtime의 유일한 공개 React API

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
• JSX에...