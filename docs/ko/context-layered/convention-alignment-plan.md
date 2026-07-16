# Context-Layered 컨벤션 정합성 계획

**상태:** 마이그레이션 기준선 정리 완료, 잔여 표면 추적 중
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

Biome는 파싱, 포맷, import 정리, 일반 lint rule처럼 언어 수준의 검사를 담당합니다. Context-Layered 규칙은 저장소 전용 명령인 `pnpm convention:check`와 `scripts/check-context-layered-conventions.mjs`에서 검사합니다. Biome GritQL 플러그인은 한 파일의 문법 패턴에는 적합하지만, Registry 위치, transitional 예외, Provider 순서처럼 파일 경계와 마이그레이션 인벤토리를 알아야 하는 규칙은 별도의 구조 검사기로 두는 편이 안정적입니다.

첫 번째 구조 규칙은 이미 활성화되어 있습니다. 모든 `use*ActionHandler(...)` 호출은 `handlers/` 모듈 또는 `*HandlerRegistry` 파일 안에 있어야 합니다. 현재 알려진 legacy/advanced 파일 11개는 transitional allowlist에 기록되어 검사 결과에 표시되지만 실패시키지는 않습니다. allowlist에 없는 새로운 직접 등록은 즉시 실패합니다. 각 표면을 마이그레이션할 때 allowlist 항목을 제거합니다.

다음 검사 단계는 Provider 순서와 레이어 경로 검사를 추가하고, transitional 인벤토리가 0개가 되거나 남은 파일이 모두 명시적인 compatibility 분류를 갖추면 allowlist를 제거하는 것입니다. `convention:check`는 이미 `verify:all`에 포함되어 있으므로 새 직접 등록은 현재도 CI에서 잡힙니다.

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

- `EnhancedAbortableSearch`는 Search Store/Action Context, 순수 검색 상태 규칙, 의미 기반 action facade, abort-aware `handlers/EnhancedAbortableSearchHandlerRegistry.tsx`로 분리했습니다. 호환성 컴포넌트는 이제 반응형 View 역할만 담당합니다.
- enhanced context-store mouse usecase는 ViewModel hook에서 handler 구현을 반환하고, 실제 등록은 `handlers/EnhancedContextStoreHandlerRegistry.tsx`에서만 수행하도록 정리했습니다. Model Provider 순서도 Action → Store → Ref로 맞췄습니다.
- `SearchPageRefactored`는 검색 데이터와 relevance/filter 규칙, typed Action/Store Context, 안정적인 command facade, `handlers/AdvancedSearchHandlerRegistry.tsx`로 분리했습니다. page는 이제 presentation과 Store subscription만 담당합니다.
- `ApiBlockingPageRefactored`는 요청·rate-limit·metric 전이를 순수 `business/api-blocking-rules.ts`로 분리하고, `actions/useApiBlockingActions.ts`에서 안정적인 command를 제공하며, 요청 lifecycle은 `handlers/ApiBlockingHandlerRegistry.tsx`에서 등록하도록 정리했습니다. 두 API Blocking route 모두 canonical page를 사용합니다.
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
2. 직접 handler를 등록하는 도메인을 Handler Registry로 이동합니다. LogMonitor, ChatUI, context-store 마우스 이벤트, conditional 권한 실행, foundations/core Basics, foundations/react Provider·Child A/B, advanced Concurrent Actions·Canvas, Action Lifecycle Workbench, useRefMountState pattern, action-priority 데모, legacy mouse-events 데모, ActionGuard context-store mouse 데모, Enhanced Abortable Search, enhanced context-store mouse usecase, SearchPageRefactored, ApiBlockingPageRefactored는 완료했습니다. 현재 foundations 호환성과 performance 영역에 11개 파일이 남아 있습니다.
3. 모든 Provider 예제를 고정된 중첩 순서로 통일합니다.
4. public hook 명명을 정리하고 legacy API 예제는 migration guide로 이동합니다.
5. Registry 위치, Provider 순서, 레이어 경로, 명명을 검사하는 `convention:check`를 추가합니다.
6. type-check, 테스트, example build, docs build, package verification을 실행합니다.

## 남은 직접 등록 인벤토리

이 목록은 canonical playbook 예제와 분리한 현재 기준선입니다. 현재 검색 결과는 11개 파일입니다. 구조 검증기를 엄격하게 적용하기 전에 각 그룹을 Registry로 이동하거나 명시적인 compatibility wrapper로 감싸야 합니다.

| 그룹 | 남은 표면 |
| --- | --- |
| Foundations와 호환성 | `lib/patterns/createObjectContextHooks.tsx` |
| Pattern 데모 | 남은 직접 등록 없음 |
| Integrations | 남은 직접 등록 없음 |
| Performance 데모 | `performance/action-guard/{ScrollPage,ScrollPageRefactored,SearchPage,ThrottleComparisonPage,ThrottleComparisonPageRefactored}.tsx`, `performance/action-guard/components/index.tsx`, `performance/memoization/components/HandlerComparisonDemo.tsx`, `performance/memoization/hooks/{useMemoizedHandlers,useNonMemoizedHandlers}.ts`, `performance/mouse-events/context-store-pattern/context/MouseEventsContext.tsx` |

## 완료 조건

- Handler Registry 외부에 handler 등록이 없습니다.
- canonical 문서와 예제가 하나의 Provider 순서를 사용합니다.
- 신규 개발에 권장되는 구조가 Context-Layered 하나로 정리됩니다.
- legacy/MVVM 자료가 migration 또는 compatibility 안내로 명시됩니다.
- 영어·한국어 컨벤션 문서가 동일한 규칙을 설명합니다.
- 구조적 drift가 발생하면 CI가 실패합니다.

다음 재진입 지점은 남은 performance 그룹입니다. 11개 인벤토리가 0이 되거나 각 파일이 compatibility 예외로 명시되기 전에는 마이그레이션 완료로 표시하지 않습니다.
