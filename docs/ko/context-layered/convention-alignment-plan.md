# Context-Layered 컨벤션 정합성 계획

**상태:** 직접 등록 인벤토리 종료, 잔여 구조 게이트 추적 중
**최근 검토:** 2026-07-16

이 문서는 기존 예제와 문서를 Context-Layered 구조에 맞추기 위한 저장소 단위 결정을 기록합니다. 구현 표준 문서와 같은 위치에서 현재 상태 분류, Provider 중첩 순서, 컨벤션을 강제하기 위한 완료 조건을 관리합니다.

## 확정 사항

### 1. 신규 구현의 단일 표준은 Context-Layered

새 시나리오는 다음 레이어를 사용합니다.

```text
contexts/  -> 경계와 Provider
business/  -> 순수 도메인 로직
handlers/  -> orchestration과 의존성 주입
actions/   -> dispatch helper와 callback
hooks/     -> 반응형 store 구독
views/     -> 렌더링과 사용자 이벤트
```

strict MVVM 자료는 마이그레이션 참고 자료로 유지하지만, 신규 implementation-playbook의 두 번째 표준으로 취급하지 않습니다.

### 2. 모든 handler는 Handler Registry에서 등록

기능 규모에 따른 예외를 두지 않습니다.

- Context 파일은 경계와 Provider를 정의·조합하며 handler를 등록하지 않습니다.
- 모든 도메인은 `*HandlerRegistry` 또는 동등한 Registry 컴포넌트를 제공합니다.
- 모든 `use*ActionHandler` 호출은 Registry 또는 그 하위 handler 모듈에 둡니다.
- Page와 View는 Registry를 마운트만 하며 handler를 직접 등록하지 않습니다.

단일 handler 예제도 이 규칙을 따릅니다. 등록, 정리, priority, 의존성 주입을 한 곳에서 검토할 수 있게 하는 것이 목적입니다.

### 3. Provider 중첩 순서 고정

canonical 중첩 순서는 다음과 같습니다.

```tsx
<DomainActionProvider>
  <DomainStoreProvider>
    <DomainRefProvider>
      <DomainHandlerRegistry>
        <DomainView />
      </DomainHandlerRegistry>
    </DomainRefProvider>
  </DomainStoreProvider>
</DomainActionProvider>
```

이는 런타임의 필수 순서라는 뜻이 아니라 저장소 컨벤션입니다. 도메인이 ref 경계를 정의할 때만 Ref Provider를 포함하며, 그렇지 않으면 Registry가 Store Provider 바로 아래에 옵니다. 모든 Registry가 필요한 경계 아래에 위치하도록 보장합니다.

## 린트와 컨벤션 검사

저장소는 2026-07-14 기준 npm `latest`인 Biome `2.5.3`을 사용합니다. 두 Biome 설정은 `biome migrate --write`로 deprecated 된 `linter.rules.recommended`를 `linter.rules.preset`으로 마이그레이션했습니다. 루트 설정은 패키지 소스에 대한 lint-only 정책을 유지하고, example 설정은 formatter를 포함하는 `check` 게이트를 유지합니다.

Biome는 파싱, 포맷, import 정리, 일반 lint rule처럼 언어 수준의 검사를 담당합니다. Context-Layered 규칙은 저장소 전용 명령인 `pnpm convention:check`와 `scripts/check-context-layered-conventions.mjs`에서 검사합니다. Biome GritQL 플러그인은 한 파일의 문법 패턴에는 적합하지만, Registry 위치, transitional 예외, Provider 순서, 마이그레이션 분류처럼 파일 경계와 인벤토리를 알아야 하는 규칙은 별도의 구조 검사기로 두는 편이 안정적입니다.

첫 번째 구조 규칙은 이미 활성화되어 있습니다. 모든 `use*ActionHandler(...)` 호출은 `handlers/` 모듈 또는 `*HandlerRegistry` 파일 안에 있어야 합니다. transitional allowlist는 이제 비어 있으며 직접 등록 인벤토리에 남은 예외가 없습니다. Registry 밖의 새로운 직접 등록은 즉시 실패합니다.

직접 등록 규칙과 함께 Provider 순서 및 canonical 레이어 경로·명명 검사도 이제 활성화되었습니다. Action → Store → Ref → Handler Registry 중첩을 강제하고 canonical root 31곳을 식별하며, 현재 Provider 순서와 레이어 경로·명명 위반을 모두 0건으로 보고합니다. `convention:check`는 이미 `verify:all`에 포함되어 있으므로 새 직접 등록과 구조 drift를 CI에서 잡습니다.

## 현재 상태 분류

다음 분류를 마이그레이션 기준선으로 사용합니다.

| 분류 | 현재 표면 | 처리 기준 |
| --- | --- | --- |
| Canonical | `example/src/pages/patterns/implementation-playbook/**`, playbook 예제, `contexts/business/handlers/actions/hooks/views` | 기준 구현으로 유지 |
| Transitional | strict MVVM 문서, `business-logic` 예제, Context/Page 직접 handler 등록, 혼재된 Provider 순서 | canonical 구조로 이동 |
| Advanced/isolated | time-travel store, performance 예제, 직접 `ActionRegister` 사용, 저수준 통합 테스트 | 고급 자료로 유지하고 기본 구조로 제시하지 않음 |
| Compatibility | legacy object 형식 Context 생성과 이전 hook alias | 호환성 유지, migration/reference 문서에서만 설명 |

### 2026-07-13 기준 근거

- `CanonicalOrderHandlers.tsx`는 이미 Action Provider, Store Provider, Ref Provider, Handler Registry를 조합합니다.
- `LogMonitor`를 첫 마이그레이션 대상으로 처리했습니다. 경계는 `contexts/`로 분리했고, 5개 handler는 `handlers/LogMonitorHandlerRegistry.tsx`에서 등록하며 Provider 순서도 canonical 기준으로 맞췄습니다.
- `ChatUI`, context-store 마우스 이벤트 컨테이너, conditional 권한 실행, foundations/react Child A/B 도메인도 전용 Registry 모듈에서만 handler를 등록하도록 정리했습니다.
- foundations/react 부모·자식 handler는 `FoundationHandlerRegistry`에서 함께 등록하고, conditional 권한 route는 canonical Action → Store Provider wrapper와 View를 감싸는 Registry를 사용하도록 통일했습니다.
- foundations/core Basics 데모는 `contexts/`, 순수 `business/` 규칙, `handlers/CoreBasicsHandlerRegistry.tsx`로 분리했습니다.
- foundations/react Provider 데모는 `handlers/ProviderHandlerRegistry.tsx`에 handler를 두고 `ProviderRuntime`을 통해 조합합니다.
- advanced Concurrent Actions 데모는 page에서 handler를 직접 등록하지 않고 task callback을 `handlers/ConcurrentActionHandlerRegistry.tsx`에 주입합니다.
- advanced Canvas 데모는 public compatibility hook을 유지하면서 `contexts/CanvasContexts.tsx`와 `handlers/CanvasHandlerRegistry.tsx`를 분리했습니다.
- `useRefMountState` pattern 데모는 `contexts/` 아래 ref/store/action 경계를 분리하고, 순수 렌더 카운트 전이는 `business/`, action command는 `actions/`, 등록은 `handlers/UseRefMountStateHandlerRegistry.tsx`로 이동했습니다.
- action-priority 데모는 순서가 있는 인증 pipeline을 `handlers/ActionPriorityDemoHandlerRegistry.tsx`에 두고, 실행 결과는 Store Context로 관리하며, `actions/useActionPriorityDemoActions.ts`에서는 의미 기반 command만 노출하도록 정리했습니다.
- legacy mouse-events 데모는 이벤트 파생 상태를 Store Context에서 관리하고, 5개 이벤트 handler는 `handlers/LegacyMouseEventsHandlerRegistry.tsx`에서 등록하도록 정리했습니다. page는 의미 기반 mouse command만 dispatch합니다.
- ActionGuard context-store mouse 데모는 position, clicks, path, recording mode를 typed Store Context에서 관리하고, 7개 state handler를 `handlers/ActionGuardMouseEventsHandlerRegistry.tsx`에서 등록하도록 정리했습니다.

### 2026-07-16 기준 근거

- conditional permission usecase는 Context-Action Provider를 `contexts/ConditionalPatternsContexts.tsx`, 순수 role/action 평가를 `business/permission-rules.ts`, 의미 기반 command를 `actions/usePermissionActions.ts`, fail-secure orchestration을 `handlers/PermissionHandlerRegistry.tsx`에 두며 `verify:conditional`이 이 경계를 보호합니다.
- action-based mouse 비교 데모는 Action/Store 계약과 Provider를 `contexts/MouseActionContexts.tsx`, 순수 path/velocity/activity 계산을 `business/mouse-rules.ts`, 등록을 `handlers/MouseActionHandlerRegistry.tsx`에 두며 기존 `stores/MouseStoreSchema.tsx` 경로는 compatibility re-export로 유지합니다.
- `EnhancedAbortableSearch`는 Search Store/Action Context, 순수 검색 상태 규칙, 의미 기반 action facade, abort-aware `handlers/EnhancedAbortableSearchHandlerRegistry.tsx`로 분리했습니다. 호환성 컴포넌트는 이제 반응형 View 역할만 담당합니다.
- enhanced context-store mouse usecase는 typed Store/Action/Ref 계약을 `contexts/EnhancedContextStoreContexts.tsx`, 순수 movement/click/activity/metric 전이를 `business/enhanced-mouse-event-rules.ts`, semantic command를 `actions/useEnhancedMouseActions.ts`, 5개 등록을 `handlers/EnhancedContextStoreHandlerRegistry.tsx`에 둡니다. `providers/EnhancedContextStoreProvider.tsx`가 reactive/non-reactive 두 route의 Action → Store → Ref → Registry 조합을 소유합니다.
- `SearchPageRefactored`는 검색 데이터와 relevance/filter 규칙, typed Action/Store Context, 안정적인 command facade, `handlers/AdvancedSearchHandlerRegistry.tsx`로 분리했습니다. page는 이제 presentation과 Store subscription만 담당합니다.
- `ApiBlockingPageRefactored`는 요청·rate-limit·metric 전이를 순수 `business/api-blocking-rules.ts`로 분리하고, `actions/useApiBlockingActions.ts`에서 안정적인 command를 제공하며, 요청 lifecycle은 `handlers/ApiBlockingHandlerRegistry.tsx`에서 등록하도록 정리했습니다. 두 API Blocking route 모두 canonical page를 사용합니다.
- `ScrollPageRefactored`는 결정적인 content/virtualization/metric 규칙, typed Action/Store/Ref Context, 의미 기반 scroll command, `handlers/ScrollHandlerRegistry.tsx`로 분리했습니다. 두 scroll route 모두 canonical page를 사용하며 Registry가 DOM animation loop를 소유합니다.
- `ThrottleComparisonPageRefactored`는 다섯 timing strategy를 `inputEvent` action으로 통합하고, timing scheduler와 auto-test timer를 `handlers/ThrottleHandlerRegistry.tsx`에 두며, metric 전이는 순수 `business/throttle-rules.ts`로 분리했습니다. 두 throttle route 모두 canonical page를 사용합니다.
- ActionGuard priority-word 데모는 등록 단어, 실행 상태, 결과를 typed Store Context에서 관리하고, 의미 기반 command는 `components/priority/actions/usePriorityDemoActions.ts`, 순서가 있는 비동기 실행은 `components/priority/handlers/PriorityDemoHandlerRegistry.tsx`가 소유하도록 정리했습니다.
- legacy Scroll·Search·Throttle entry point는 canonical Refactored page를 재수출하는 compatibility wrapper가 되어 기존 source link를 유지하면서 직접 handler 등록은 보존하지 않습니다.
- memoization 비교 데모는 Context-Action 계약과 Provider를 `contexts/ComparisonContexts.ts`, 순수 비교 전이를 `business/comparison-rules.ts`, 의미 기반 command를 `actions/useComparisonActions.ts`에 두고, 두 handler lane과 performance control 등록을 `handlers/ComparisonHandlerRegistry.tsx`에서 관리합니다. 기존 model과 hook 경로는 compatibility re-export로 유지합니다.
- context-store mouse usecase는 6개 이벤트 등록을 `context-store-pattern/handlers/MouseEventsHandlerRegistry.tsx`로 이동했습니다. `providers/MouseEventsProvider.tsx`가 Action → Store → Registry 조합을 소유하고, context 모듈은 계약과 파생 규칙 경계로 남습니다.
- context-store mouse 비교 데모는 public Context-Action 경계를 `context-store-pattern/contexts/MouseEventsContexts.tsx`로 노출합니다. 6개 handler는 `handlers/MouseEventsHandlerRegistry.tsx`에 남기고, 기존 aggregate helper는 compatibility export 뒤에 격리했습니다.
- 범용 `createObjectContextHooks` factory는 Action → Manager → Store 동기화를 `lib/patterns/handlers/ObjectContextHandlerRegistry.tsx`에 위임합니다. 내부 ActionRegister를 노출하는 대신 `ObjectContextManager.dispatch`를 도메인 경계의 안전한 bridge로 사용합니다.
- 컨벤션 검사기는 object-context factory, Flow Control, API Blocking, memoization, priority, mouse-event 조합의 Provider 중첩도 검증합니다. `pnpm convention:check` 결과 Provider 순서 위반은 0건입니다.
- 컨벤션 검사기는 canonical root 31곳의 레이어 경로, 파일 명명, import 경계도 검증합니다. conditional permission, action-based mouse, context-store mouse, enhanced context-store mouse usecase의 Context-Action 경계를 `contexts/` 아래로 이동했고, implementation-playbook View의 packet·quote는 Data Hook에서 계산하며 레이어 경로·명명 위반은 0건입니다.
- `tools/context-action-lint/layered-surface-classification.json`에는 유일하게 남은 비정형 `handlers/` 표면인 compatibility object-context root만 기록했습니다. 분류되지 않은 추가와 stale 분류는 `convention:check`를 실패시킵니다.
- `docs/en/concept/conventions.md`는 strict MVVM을 설명하므로 병렬 표준이 아니라 migration/legacy 안내로 연결해야 합니다.
- 기존 문서와 예제에는 두 Provider 순서가 모두 존재합니다. 저장소 검색 결과 action-then-store 19건, store-then-action 20건이 확인되었으며, 이는 런타임 실패가 아닌 구조 인벤토리입니다.

### 2026-07-13 검증 근거

- `pnpm --dir example type-check` 통과.
- `pnpm --dir example build:fast` 통과.
- `pnpm test:canonical-example` 통과(1 suite, 4 tests).
- `pnpm docs:build` 통과.
- `http://127.0.0.1:4000/` 개발 서버에서 `/react/context`, `/actionguard/conditional/permissions`를 열고 Child A/B 상호작용, 권한 승인, audit 출력을 확인했습니다.
- LogMonitor Registry readiness gate 추가 후 새 브라우저 로드의 시작 warning/error가 0건이었습니다.

## 마이그레이션 순서

1. 영어·한국어 컨벤션 인덱스에 이 결정을 추가합니다.
2. 직접 handler를 등록하는 도메인을 Handler Registry로 이동합니다. LogMonitor, ChatUI, context-store 마우스 이벤트, conditional 권한 실행, foundations/core Basics, foundations/react Provider·Child A/B, advanced Concurrent Actions·Canvas, Action Lifecycle Workbench, useRefMountState pattern, action-priority 데모, legacy mouse-events 데모, ActionGuard context-store mouse 데모, Enhanced Abortable Search, enhanced context-store mouse usecase, SearchPageRefactored, ApiBlockingPageRefactored, ScrollPageRefactored, ThrottleComparisonPageRefactored, ActionGuard priority-word 데모, memoization 비교 데모, 범용 object-context factory까지 완료했습니다. 직접 등록 인벤토리는 이제 비어 있습니다.
3. 모든 Provider 예제를 고정된 중첩 순서로 통일합니다.
4. public hook 명명을 정리하고 legacy API 예제는 migration guide로 이동합니다.
5. 활성화된 `convention:check`의 Registry 위치·Provider 순서·canonical 레이어 경로·파일 명명·import 경계·advanced/compatibility 명시 분류 게이트를 유지하고, 해당 표면이 마이그레이션될 때 canonical 검사 범위를 확장합니다.
6. type-check, 테스트, example build, docs build, package verification을 실행합니다.

## 남은 직접 등록 인벤토리

이 목록은 canonical playbook 예제와 분리한 현재 기준선입니다. 현재 검색 결과 직접 등록 파일은 없습니다. 따라서 구조 검증기는 transitional 예외 없이 실행할 수 있습니다.

| 그룹 | 남은 표면 |
| --- | --- |
| Foundations와 호환성 | 남은 직접 등록 없음 |
| Pattern 데모 | 남은 직접 등록 없음 |
| Integrations | 남은 직접 등록 없음 |
| Performance 데모 | 남은 직접 등록 없음 |

## 완료 조건

- Handler Registry 외부에 handler 등록이 없습니다.
- canonical 문서와 예제가 하나의 Provider 순서를 사용합니다.
- 신규 개발에 권장되는 구조가 Context-Layered 하나로 정리됩니다.
- legacy/MVVM 자료가 migration 또는 compatibility 안내로 명시됩니다.
- 영어·한국어 컨벤션 문서가 동일한 규칙을 설명합니다.
- 구조적 drift가 발생하면 CI가 실패합니다.

직접 등록, Provider 순서, canonical 레이어 경로·명명, 마이그레이션 분류 게이트는 완료되었습니다. advanced 비교 표면 인벤토리도 비어 있으므로, 남은 compatibility export를 문서화하고 Registry 모듈 밖에 새로운 handler 등록을 추가하지 않습니다.
