---
document_id: context-layered--implementation-convention
category: context-layered
source_path: ko/context-layered/implementation-convention.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.489Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 표준 컨벤션

Implementation Playbook 표준 컨벤션 이 문서는 implementation-playbook에서 정리한 구조를 저장소 전반에서 재사용할 수 있도록 고정한 표준 컨벤션입니다. 목표는 “예제가 잘 보이는 것”이 아니라, 복잡한 로직이 늘어나도 같은 방식으로 설계, 구현, 테스트, 문서화할 수 있게 만드는 데 있습니다. 언제 이 컨벤션을 쓰는가 다음 조건 중 둘 이상이 보이면 이 컨벤션을 권장합니다. - 입력 검증과 후속 처리 흐름이 분리되어야 한다 - 비동기 단계가 2개 이상 존재한다 - 성공/실패/리셋/재시도 상태가 모두 필요하다 - activity log, analytics, ref focus 같은 side effect가 함께 움직인다 - 문서, 예제, 테스트를 같은 계약으로 묶어야 한다 작은 기능은 business 또는 view 파일 수를 줄일 수 있지만, action handler 등록은 아래 Handler Registry 규칙을 항상 따릅니다. 표준 폴더 구조 레이어별 책임 contexts/ - Action, Store, Ref 경계를 정의한다 - 초기 상태를 둔다 - 상태 타입은 여기서 import해서 조립한다 business/ - 순수 함수만 둔다 - draft 기본값 - validation issue 계산 - 결과 계산 - activity event 정의 - 명시적 상태 전이 함수 문자열 문구, DOM focus, analytics 호출은 넣지 않습니다. handlers/ - 최신 store 값을 읽는다 - business 순수 함수를 호출한다 - state machine 전이를 적용한다 - ref focus, scroll, logging 같은 side effect를 조율한다 핸들러는 관심사별로 쪼갭니다. - useScenarioDraftHandlers - useScenarioSubmissionHandlers - 필요하면 useScenarioApprovalHandlers, useScenarioSyncHandlers 등으로 분리 단일 handler 기능을 포함한 모든 handler는 도메인 Handler Registry를 통해 등록합니다. Page, View, Context 파일은 Registry를 마운트·조합만 하며 useActionHandler를 직접 호출하지 않습니다. actions/ - view가 쓰는 dispatch helper만 둔다 - payload shaping 정도만 허용한다 hooks/ - store 구독 - view 전용 파생값 계산 - state machine 상태를 화면용 label/message로 해석 views/ - 렌더링과 입력 전달만 담당한다 - validation 규칙, quote 계산, 상태 전이 로직을 직접 품지 않는다 구조 컨벤션 게이트 pnpm convention:check는 같은 feature root에 contexts/와 handlers/ 디렉터리가 함께 있을 때 이를 canonical 표면으로 식별합니다. 그 아래의 직접 레이어 디렉터리만 검사하므로, 아직 마이그레이션하지 않은 advanced 및 compatibility 표면에는 canonical 명명 규칙을 일괄 적용하지 않습니다. 현재 게이트가 검사하는 내용은 다음과 같습니다. - contexts/ 파일은 Context 또는 Contexts로 끝납니다. - business/ 파일은 lower-camel 또는 kebab-case로 이름 짓고 React와 @context-action/ import를 갖지 않습니다. - handlers/ 파일은 HandlerRegistry, Handlers, HandlerSupport, HandlerDefinitions 명명을 사용합니다. index와 handler-registry 진입점은 예외로 허용합니다. - actions/ 파일은 Actions 또는 ActionHandlers로 이름 짓습니다. - hooks/ 파일은 use 명명을 사용하며 index, types 진입점을 허용합니다. - views/ 파일은 View, Views 또는 Grid 같은 명시적 composite 명명을 사용합니다. - Context 모듈은 downstream 레이어를 import하지 않으며, View는 framework runtime·business·handler 모듈을 직접 import하지 않습니다. 파생 business 값은 View에 도달하기 전에 Hook 또는 Facade에서 계산합니다. 예를 들어 implementation-playbook의 packet과 quote preview는 Data Hook이 계산하고 View는 반환된 model만 렌더링합니다. usecase 전용 검사와 함께 다음 게이트를 실행합니다. 현재 게이트는 canonical root 31곳을 검사하며 레이어 경로·명명 위반은 0건입니다. advanced 및 compatibility root는 마이그레이션 분류가 바뀔 때까지 이 자동 명명 범위에서 명시적으로 제외합니다. 비정형 handlers/ 디렉터리를 조용히 무시하지 않습니다. 현재 분류와 근거는 tools/context-action-lint/layered-surface-classification.json에 두며, 검사기는 모든 비정형 디렉터리가 advanced 또는 compatibility 중 하나로 등록되어 있는지 확인합니다. 현재 manifest에는 advanced 비교 표면이 없고 compatibility object-context 표면 1곳이 있습니다. conditional permission, action-based mouse, context-store mouse, enhanced context-store mou

Key points:
• 입력 검증과 후속 처리 흐름이 분리되어야 한다
• 비동기 단계가 2개 이상 존재한다
• 성공/실패/리셋/재시도 상태가 모두 필요하다
• activity log, analytics, ref focus 같은 side effect가 함께 움직인다
• 문서, 예제, 테스트를 같은 계약으로 묶어야 한다
• Action, Store, Ref 경계를 정의한다
• 초기 상태를 둔다
• 상태 타입은 여기서 import해서 조립한다
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
• `contexts/` 파일은 `Context` 또는 `Contexts`로 끝납니다.
• `business/` 파일은 lower-camel 또는 kebab-case로 이름 짓고 React와
• `handlers/` 파일은 `*HandlerRegistry`, `*Handlers`, `*HandlerSupport`,
• `actions/` 파일은 `*Actions` 또는 `*ActionHandlers`로 이름 짓습니다.
• `hooks/` 파일은 `use*` 명명을 사용하며 `index`, `types` 진입점을
• `views/` 파일은 `*View`, `*Views` 또는 `*Grid` 같은 명시적 composite
• Context 모듈은 downstream 레이어를 import하지 않으며, View는 framework
• 상태는 workflow phase로 이름 짓는다
• 이벤트는 user intent 또는 system outcome으로 이름 짓는다
• 전이 함수는 순수 함수로 유지한다
• side effect는 handler에서 실행한다
• view는 상태를 해석한 결과만 렌더링한다
• `pnpm test:canonical-example`
• `pnpm --dir example type-check`
• `pnpm --dir example build:fast`
• `pnpm --filter example run verify:conditional`
• `pnpm --filter @context-action/react test -- __tests__/patterns/enhanced-context-store.rules.test.ts`
• `pnpm --filter @context-action/react test -- __tests__/patterns/enhanced-context-store.integration.test.tsx`