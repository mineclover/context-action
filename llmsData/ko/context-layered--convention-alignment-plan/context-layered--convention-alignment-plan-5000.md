---
document_id: context-layered--convention-alignment-plan
category: context-layered
source_path: ko/context-layered/convention-alignment-plan.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.494Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered 컨벤션 정합성 계획

Context-Layered 컨벤션 정합성 계획 상태: 직접 등록 인벤토리 종료, 잔여 구조 게이트 추적 중 최근 검토: 2026-07-16 이 문서는 기존 예제와 문서를 Context-Layered 구조에 맞추기 위한 저장소 단위 결정을 기록합니다. 구현 표준 문서와 같은 위치에서 현재 상태 분류, Provider 중첩 순서, 컨벤션을 강제하기 위한 완료 조건을 관리합니다. 확정 사항 1. 신규 구현의 단일 표준은 Context-Layered 새 시나리오는 다음 레이어를 사용합니다. strict MVVM 자료는 마이그레이션 참고 자료로 유지하지만, 신규 implementation-playbook의 두 번째 표준으로 취급하지 않습니다. 2. 모든 handler는 Handler Registry에서 등록 기능 규모에 따른 예외를 두지 않습니다. - Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다. - 모든 도메인은 HandlerRegistry 또는 동등한 Registry 컴포넌트를 제공합니다. - 모든 useActionHandler 호출은 Registry 또는 그 하위 handler 모듈에 둡니다. - Page와 View는 Registry를 마운트만 하며 handler를 직접 등록하지 않습니다. 단일 handler 예제도 이 규칙을 따릅니다. 등록, 정리, priority, 의존성 주입을 한 곳에서 검토할 수 있게 하는 것이 목적입니다. 3. Provider 중첩 순서 고정 canonical 중첩 순서는 다음과 같습니다. 이는 런타임의 필수 순서라는 뜻이 아니라 저장소 컨벤션입니다. 도메인이 ref 경계를 정의할 때만 Ref Provider를 포함하며, 그렇지 않으면 Registry가 Store Provider 바로 아래에 옵니다. 모든 Registry가 필요한 경계 아래에 위치하도록 보장합니다. 린트와 컨벤션 검사 저장소는 2026-07-14 기준 npm latest인 Biome 2.5.3을 사용합니다. 두 Biome 설정은 biome migrate --write로 deprecated 된 linter.rules.recommended를 linter.rules.preset으로 마이그레이션했습니다. 루트 설정은 패키지 소스에 대한 lint-only 정책을 유지하고, example 설정은 formatter를 포함하는 check 게이트를 유지합니다. Biome는 파싱, 포맷, import 정리, 일반 lint rule처럼 언어 수준의 검사를 담당합니다. Context-Layered 규칙은 저장소 전용 명령인 pnpm convention:check와 scripts/check-context-layered-conventions.mjs에서 검사합니다. Biome GritQL 플러그인은 한 파일의 문법 패턴에는 적합하지만, Registry 위치, transitional 예외, Provider 순서, 마이그레이션 분류처럼 파일 경계와 인벤토리를 알아야 하는 규칙은 별도의 구조 검사기로 두는 편이 안정적입니다. 첫 번째 구조 규칙은 이미 활성화되어 있습니다. 모든 useActionHandler(...) 호출은 handlers/ 모듈 또는 HandlerRegistry 파일 안에 있어야 합니다. transitional allowlist는 이제 비어 있으며 직접 등록 인벤토리에 남은 예외가 없습니다. Registry 밖의 새로운 직접 등록은 즉시 실패합니다. 직접 등록 규칙과 함께 Provider 순서 및 canonical 레이어 경로·명명 검사도 이제 활성화되었습니다. Action → Store → Ref → Handler Registry 중첩을 강제하고 canonical root 31곳을 식별하며, 현재 Provider 순서와 레이어 경로·명명 위반을 모두 0건으로 보고합니다. convention:check는 이미 verify:all에 포함되어 있으므로 새 직접 등록과 구조 drift를 CI에서 잡습니다. 현재 상태 분류 다음 분류를 마이그레이션 기준선으로 사용합니다. | 분류 | 현재 표면 | 처리 기준 | | --- | --- | --- | | Canonical | example/src/pages/patterns/implementation-playbook/, playbook 예제, contexts/business/handlers/actions/hooks/views | 기준 구현으로 유지 | | Transitional | strict MVVM 문서, business-logic 예제, Context/Page 직접 handler 등록, 혼재된 Provider 순서 | canonical 구조로 이동 | | Advanced/isolated | time-travel store, performance 예제, 직접 ActionRegister 사용, 저수준 통합 테스트 | 고급 자료로 유지하고 기본 구조로 제시하지 않음 | | Compatibility | legacy object 형식 Context 생성과 이전 hook alias | 호환성 유지, migration/reference 문서에서만 설명 | 2026-07-13 기준 근거 - CanonicalOrderHandlers.tsx는 이미 Action Provider, Store Provider, Ref Provider, Handler Registry를 조합합니다. - LogMonitor를 첫 마이그레이션 대상으로 처리했습니다. 경계는 contexts/로 분리했고, 5개 handler는 handlers/LogMonitorHandlerRegistry.tsx에서 등록하며 Provider 순서도 canonical 기준으로 맞췄습니

Key points:
• Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다.
• 모든 도메인은 `*HandlerRegistry` 또는 동등한 Registry 컴포넌트를 제공합니다.
• 모든 `use*ActionHandler` 호출은 Registry 또는 그 하위 handler 모듈에 둡니다.
• Page와 View는 Registry를 마운트만 하며 handler를 직접 등록하지 않습니다.
• `CanonicalOrderHandlers.tsx`는 이미 Action Provider, Store Provider, Ref Provider, Handler Registry를 조합합니다.
• `LogMonitor`를 첫 마이그레이션 대상으로 처리했습니다. 경계는 `contexts/`로 분리했고, 5개 handler는 `handlers/LogMonitorHandlerRegistry.tsx`에서 등록하며 Provider 순서도 canonical 기준으로 맞췄습니다.
• `ChatUI`, context-store 마우스 이벤트 컨테이너, conditional 권한 실행, foundations/react Child A/B 도메인도 전용 Registry 모듈에서만 handler를 등록하도록 정리했습니다.
• foundations/react 부모·자식 handler는 `FoundationHandlerRegistry`에서 함께 등록하고, conditional 권한 route는 canonical Action → Store Provider wrapper와 View를 감싸는 Registry를 사용하도록 통일했습니다.
• foundations/core Basics 데모는 `contexts/`, 순수 `business/` 규칙, `handlers/CoreBasicsHandlerRegistry.tsx`로 분리했습니다.
• foundations/react Provider 데모는 `handlers/ProviderHandlerRegistry.tsx`에 handler를 두고 `ProviderRuntime`을 통해 조합합니다.
• advanced Concurrent Actions 데모는 page에서 handler를 직접 등록하지 않고 task callback을 `handlers/ConcurrentActionHandlerRegistry.tsx`에 주입합니다.
• advanced Canvas 데모는 public compatibility hook을 유지하면서 `contexts/CanvasContexts.tsx`와 `handlers/CanvasHandlerRegistry.tsx`를 분리했습니다.
• `useRefMountState` pattern 데모는 `contexts/` 아래 ref/store/action 경계를 분리하고, 순수 렌더 카운트 전이는 `business/`, action command는 `actions/`, 등록은 `handlers/UseRefMountStateHandlerRegistry.tsx`로 이동했습니다.
• action-priority 데모는 순서가 있는 인증 pipeline을 `handlers/ActionPriorityDemoHandlerRegistry.tsx`에 두고, 실행 결과는 Store Context로 관리하며, `actions/useActionPriorityDemoActions.ts`에서는 의미 기반 command만 노출하도록 정리했습니다.
• legacy mouse-events 데모는 이벤트 파생 상태를 Store Context에서 관리하고, 5개 이벤트 handler는 `handlers/LegacyMouseEventsHandlerRegistry.tsx`에서 등록하도록...