---
document_id: examples--canonical-order-form
category: examples
source_path: ko/examples/canonical-order-form.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.538Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Canonical Order Form 예제

Canonical Order Form 예제 이 예제는 저장소에서 권장하는 구현 중심 walkthrough입니다. 규모는 작지만, Context-Layered Architecture가 왜 안정성을 높이는지 보여주기에 충분하도록 구성되어 있습니다. 아키텍처를 이해하기 위해 예제를 하나만 읽는다면 이 예제를 먼저 보는 것을 권장합니다. 이 예제가 보여주는 것 - draft, validation, submission, activity 상태를 위한 Store Context - 사용자 의도와 흐름 조율을 위한 Action Context - 검증 실패 후 포커스 이동을 위한 Ref Context - 결정론적 validation과 quote 계산을 위한 순수 business 함수 - 숨겨진 비즈니스 로직 없이 렌더링만 담당하는 reactive hooks와 views 라우트 live example은 example 앱에서 다음 경로로 확인할 수 있습니다. 파일 구조 런타임 흐름 명시적 상태 머신 이 예제의 submission 흐름은 단순 status string 갱신이 아니라, 상태 + 이벤트 + 전이 함수 조합으로 관리됩니다. 관련 파일: - business/submissionStateMachine.ts - handlers/useCanonicalOrderSubmissionHandlers.tsx - handlers/orderHandlerSupport.ts 상세 설명은 명시적 상태 머신 문서를 함께 보시면 됩니다. 스펙 문서 예시 이 예제를 실제 작업 단위로 쪼개고 싶다면, 아래처럼 간단한 스펙 문서 형식으로 먼저 고정한 뒤 구현에 들어가는 방식이 가장 안정적입니다. 이 형식으로 먼저 스펙을 고정하면, 문서 설명과 실제 구현, 테스트 기준이 서로 어긋나지 않게 관리하기 쉬워집니다. 왜 canonical example인가 이 예제는 다음 다섯 가지 실무 질문에 빠르게 답하도록 설계되었습니다. 상태는 어디에 두는가 상태는 view 로컬 비즈니스 상태가 아니라 store에 둡니다. -

Key points:
• draft, validation, submission, activity 상태를 위한 `Store Context`
• 사용자 의도와 흐름 조율을 위한 `Action Context`
• 검증 실패 후 포커스 이동을 위한 `Ref Context`
• 결정론적 validation과 quote 계산을 위한 순수 `business` 함수
• 숨겨진 비즈니스 로직 없이 렌더링만 담당하는 reactive `hooks`와 `views`
• `business/submissionStateMachine.ts`
• `handlers/useCanonicalOrderSubmissionHandlers.tsx`
• `handlers/orderHandlerSupport.ts`
• Action, Store, Ref가 함께 동작하는 실제 예제를 제공한다.
• 파일 읽기 순서가 명확한 implementation-first example을 제공한다.
• validation 실패 시 focus 이동을 포함한 실제 동작을 검증한다.
• 예제 설명 문서와 실제 구현 파일, 테스트 파일을 연결한다.
• `pnpm test:canonical-example`
• `pnpm docs:build`
• `pnpm --dir example...