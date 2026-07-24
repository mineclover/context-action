---
document_id: context-layered--architecture--handler-registry
category: context-layered
source_path: ko/context-layered/architecture/handler-registry.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.480Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
핸들러 레지스트리 패턴

핸들러 레지스트리 패턴 핸들러 레지스트리 패턴은 handler의 ID, priority, dispatch 이름을 중앙에서 관리하는 방식입니다. 이 패턴을 도입하면 이름 충돌을 줄이고, 실행 순서를 문서화하기 쉬워지며, 테스트와 디버깅도 훨씬 단순해집니다. 왜 필요한가 규모가 커질수록 다음 문제가 자주 생깁니다. - 동일한 액션 이름을 서로 다른 의미로 사용 - handler 등록 위치가 흩어져 우선순위 파악이 어려움 - module별 handler를 동적으로 붙일 때 naming 규칙이 깨짐 레지스트리는 이런 문제를 “하나의 명명 규칙”과 “하나의 우선순위 규칙”으로 정리합니다. 기본 구조 이 패턴에서 중요한 것은 dispatchName과 id를 분리하는 점입니다. - dispatchName은 view/action 레이어가 쓰는 공개 이름 - id는 내부 등록과 추적용 식별자 우선순위 설계 방식 우선순위를 숫자로만 두면 금방 혼란스러워집니다. 실무에서는 범위를 나눠 쓰는 것이 좋습니다. 이렇게 해두면 코드만 봐도 “이 handler가 어떤 단계에 속하는지”를 알 수 있습니다. 도메인별 레지스트리 예시 이런 구성이 있으면: - actions/에서는 dispatch(CHECKOUTHANDLERS.SUBMIT.dispatchName, payload)를 사용 - handlers/에서는 CHECKOUTHANDLERS.SUBMIT.id와 priority를 그대로 사용 즉 view와 handler가 같은 계약을 공유하게 됩니다. 모듈별 확장 여러 인스턴스를 동시에 띄우는 경우에는 moduleId를 접두사로 붙이는 방식이 유용합니다. 이렇게 하면 같은 checkout 기능이 여러 화면이나 탭에서 동시에 살아 있어도 충돌을 줄일 수 있습니다. 운영 규칙 - handler ID는 사람이 읽을 수 있어야 합니다. - priority는 규칙 없이 임의 숫자를 쓰지 말고 밴드를 정해서 쓰는 것이 좋습니다. - 레지스트리 파일은 가능한 한 h

Key points:
• 동일한 액션 이름을 서로 다른 의미로 사용
• handler 등록 위치가 흩어져 우선순위 파악이 어려움
• module별 handler를 동적으로 붙일 때 naming 규칙이 깨짐
• `dispatchName`은 view/action 레이어가 쓰는 공개 이름
• `id`는 내부 등록과 추적용 식별자
• `actions/`에서는 `dispatch(CHECKOUT_HANDLERS.SUBMIT.dispatchName, payload)`를 사용
• `handlers/`에서는 `CHECKOUT_HANDLERS.SUBMIT.id`와 `priority`를 그대로 사용
• handler ID는 사람이 읽을 수 있어야 합니다.
• priority는 규칙 없이 임의 숫자를 쓰지 말고 밴드를 정해서 쓰는 것이 좋습니다.
• 레지스트리 파일은 가능한 한 `handlers/handler-registry.ts`처럼 한 곳에 둡니다.
• 테스트에서는 레지스트리 숫자 자체보다 “실행 순서가 의도와 맞는지”를 검증하세요.
• 같은 액션에 여러 handler가 등록될 때 priority 순으로 실행되는가
• 특정 moduleId를 붙여도 ID 충돌이 없는가
• dispatch 이름 변경 시 actions와...