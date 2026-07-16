# Context-Layered Usecase 및 Recipe Profile

기존 6-layer 구조는 내부 runtime 아키텍처로 유지합니다. 이 profile은 runtime을 디자인 시스템 기반 product UI에 연결하기 위한 공개 경계를 추가합니다.

## 위치

```text
Product Scope
  └─ Provider + Handler Registry
       └─ Recipe
            ├─ Astryx primitive
            └─ Usecase Facade
                 └─ Context-Layered Runtime
                      ├─ contexts
                      ├─ business
                      ├─ handlers
                      ├─ actions
                      └─ hooks
```

`Context-Layered Architecture`는 상위 개념으로 유지합니다. `Usecase Boundary`, `Facade`, `Recipe`는 새로운 경쟁 아키텍처가 아니라 기존 구조 안의 공개 경계입니다.

## 왜 필요한가

기존 6-layer는 실행 흐름은 설명하지만 product UI와 연결되는 경계를 충분히 설명하지 못했습니다.

- `actions`와 `hooks`가 의도치 않게 공개 API가 될 수 있습니다.
- `views`가 순수 표현과 제품 조합을 함께 포함할 수 있습니다.
- Astryx primitive가 domain state나 `context-action`에 직접 결합될 수 있습니다.

| 경계 | 소유하는 것 | 소유하지 않는 것 |
| --- | --- | --- |
| Domain business | 순수 검증, 계산, 상태 전이 | React, store, UI 문구 |
| Runtime | Context, handler, dispatch, subscription | Astryx component |
| Facade | 안정적인 command와 view model | layout과 시각 정책 |
| Recipe | Astryx 조합과 prop 연결 | domain rule과 raw dispatch |
| Product scope | Provider, registry, route, 외부 데이터 | 개별 handler 구현 |

## 권장 feature 구조

기존 기능은 6-layer 폴더를 유지하면서 `facade`와 `recipes`를 추가합니다.

```text
access-request/
├── contexts/
├── business/
├── handlers/
├── actions/
├── hooks/
├── facade/
│   └── useAccessRequestFacade.ts
├── recipes/
│   └── AccessRequestRecipe.tsx
├── views/
└── AccessRequestPage.tsx
```

신규 기능은 runtime을 묶어도 됩니다.

```text
feature/
├── contract/
├── domain/
├── runtime/
│   ├── contexts/
│   ├── handlers/
│   ├── actions/
│   └── hooks/
├── facade/
├── recipe/
└── scope/
```

## Facade 컨벤션

Facade는 feature runtime의 유일한 공개 React API입니다.

```tsx
const vm = useAccessRequestFacade();

vm.workflow.phase;
vm.canSubmit;
vm.commands.changeReason(value);
vm.commands.submit();
```

규칙:

- 상태는 명사, command는 동사로 이름을 짓습니다.
- handler ID, store manager, raw `dispatch`를 노출하지 않습니다.
- `isOpen`, `isBusy`, `canSubmit` 같은 파생 값은 facade에서 계산합니다.
- async result, abort, retry, error 변환도 facade 안에 둡니다.

권장 이름:

```text
AccessRequestProvider
AccessRequestHandlerRegistry
useAccessRequestFacade
AccessRequestRecipe
```

## Recipe 컨벤션

Recipe는 facade view model을 Astryx controlled prop으로 변환합니다.

```tsx
<Drawer isOpen={vm.isOpen} onClose={vm.commands.close}>
  <Textarea
    value={vm.reason}
    onChange={vm.commands.changeReason}
  />
  <Button
    isLoading={vm.isBusy}
    isDisabled={!vm.canSubmit}
    onClick={vm.commands.submit}
  />
</Drawer>
```

규칙:

- 디자인 시스템 primitive와 feature facade만 import합니다.
- `isOpen`, `value`, `isLoading`, `status` 같은 controlled 계약을 유지합니다.
- focus, ARIA, keyboard, intrinsic interaction은 primitive가 소유합니다.
- primitive에서 `context-action`을 직접 import하지 않습니다.
- JSX에 validation이나 business transition을 작성하지 않습니다.

## Ref 마운트 관찰 usecase

프레임워크 pattern 데모에서 DOM 경계를 관찰해야 할 때는 DOM node 자체를
애플리케이션 state로 만들지 않습니다. ref context는 등록과 mount lifecycle을,
store는 파생 관찰값을, action은 사용자 의도를 소유하도록 분리합니다.

```text
Ref mount lifecycle → action intent → Handler Registry → 순수 state 전이 → Store subscription
```

`useRefMountState` 데모를 이 경우의 기준 recipe로 사용합니다.

- `contexts/`가 action, store, ref 계약을 소유합니다.
- `business/`에는 렌더 카운트 증가 같은 순수 전이 함수를 둡니다.
- `handlers/`만 `use*ActionHandler`를 등록합니다.
- `actions/`는 `resetRenderCounts` 같은 의미 기반 command를 공개합니다.
- view는 `useRefMountState`와 `useStoreValue`로 읽고 store를 직접 변경하지 않습니다.

mount callback은 필요한 범위의 DOM 동기화만 수행할 수 있지만, 두 번째 state
관리 채널이 되어서는 안 됩니다. 관찰값을 화면에 표시해야 한다면 intent를
dispatch하고 렌더링 값은 Store Context에 유지합니다. 도메인은
Action → Store → Ref → Handler Registry → View 순서로 조합합니다.

## Priority pipeline usecase

검증, 정책, business 작업, 관찰 로직을 하나의 action 아래 순서대로 실행해야
할 때 priority pipeline을 사용합니다. 실행 순서는 하나의 Handler Registry에
명시적으로 둡니다.

```text
authenticate → 100 validation → 95 security → 90 rate limit
             → 80 business → 30 analytics → 10 audit
```

각 등록에는 안정적인 handler ID와 문서화된 priority를 지정합니다. blocking
단계는 controller로 abort하여 이후 단계를 막고, 이후 단계의 결과는 page의
React local state를 캡처하지 않고 Store Context를 통해 기록합니다. 이렇게 하면
실행 trace를 관찰할 수 있고 page component를 읽지 않아도 priority 설정을
검토할 수 있습니다.

## Action 및 Handler 이름

Action은 저장소 mutation이 아니라 사용자 의도를 표현합니다.

```text
selectResource
changeReason
submitRequest
cancelRequest
retryRequest
resetRequest
```

Handler ID는 feature, action, stage를 포함합니다.

```text
access-request.submit.validation
access-request.submit.policy
access-request.submit.request
access-request.submit.audit
```

권장 priority band:

| Priority | 단계 | Blocking |
| ---: | --- | --- |
| 100 | Contract 및 입력 검증 | 예 |
| 80 | Policy 및 권한 검사 | 예 |
| 50 | Business 작업 또는 요청 | 예 |
| 20 | View 동기화 | 보통 아니오 |
| 10 | Audit 및 telemetry | 아니오 |

## Priority 단어 실행 usecase

ActionGuard priority-word 데모는 사용자가 등록한 command를 명시적인 우선순위로
실행하는 작은 usecase입니다.

```text
registerWord → executeRegistered → 순서가 있는 Registry 실행 → status + result Store
```

- `components/priority/business/priority-demo-rules.ts`가 중복 검사, priority
  정렬, status 전이, 결과 조합을 순수 규칙으로 소유합니다.
- `contexts/PriorityDemoContexts.tsx`가 Action·Store 계약을 정의하고 등록 목록,
  실행 상태, 화면 결과를 관찰 가능하게 유지합니다.
- `actions/usePriorityDemoActions.ts`는 Store mutation을 View에 노출하지 않고
  `registerWord`, `executeRegistered`, `clear` command를 제공합니다.
- `handlers/PriorityDemoHandlerRegistry.tsx`가 순서가 있는 비동기 실행, 단계별
  지연, cancellation token, cleanup을 소유합니다.

command palette, 승인 단계, staged workflow처럼 사용자가 등록한 순서와 실제
실행 priority를 분리해야 하는 경우 이 recipe를 사용합니다. 실행 trace는
Store에 두어 View가 등록·실행 중·완료 상태를 표현하도록 하고 pipeline 자체는
View가 소유하지 않게 합니다.

## Memoization 비교 usecase

memoization 데모는 비교 mechanics를 widget에 섞지 않고 안정적인 handler와
의도적으로 재등록되는 handler를 비교합니다.

```text
control command → ComparisonHandlerRegistry → memoized/non-memoized Store
                 → render metric + data status View
```

- `business/comparison-rules.ts`가 counter, calculation, heavy-data,
  memory-data 전이를 순수 함수로 소유합니다.
- `handlers/ComparisonHandlerRegistry.tsx`가 두 action lane과 performance
  control handler를 모두 소유합니다. stable lane은 `useCallback`을 사용하고,
  비교 lane은 같은 Registry 경계 안에서 handler reference를 의도적으로
  재생성합니다.
- `actions/useComparisonActions.ts`는 widget에 안정적인 command를 제공하고,
  `useComparisonViewState`는 읽기 전용 presentation state를 유지합니다.
- 기존 component와 handler hook은 compatibility re-export/status hook으로
  남겨 기존 link가 직접 등록을 다시 도입하지 않게 합니다.

handler identity, registration churn, lazy Store read의 효과를 측정할 때 이
recipe를 사용합니다. 비교 의도는 Registry 안에 명시하고 legacy 경로가 두 번째
아키텍처 표준이 되지 않게 합니다.

## 범용 object-context 동기화 usecase

하나의 도메인에서 객체 lifecycle command, Manager가 소유한 runtime, 반응형
metadata를 함께 관리하면서 View를 Manager 구현과 분리해야 할 때 범용
object-context factory를 사용합니다.

```text
semantic command → ObjectContextHandlerRegistry
                 → ObjectContextManager.dispatch → typed Store → view
```

- `createObjectContextHooks`가 Action·Store·Manager 계약과 호환 public hook을
  생성합니다.
- `handlers/ObjectContextHandlerRegistry.tsx`가 lifecycle, selection, focus,
  cleanup action을 등록하고 metadata를 Store에 동기화합니다.
- `ObjectContextManager`가 도메인 lifecycle 동작을 소유하며, public `dispatch`
  bridge를 통해 내부 `ActionRegister`를 비공개로 유지합니다.

여러 typed entity를 관리하는 dashboard, editor, catalog에서 object list,
selection, focus, cleanup 상태를 독립적으로 구독해야 할 때 이 recipe를
사용합니다.

## 고빈도 포인터 추적 usecase

고빈도 입력과 파생 metric, 직접 DOM 피드백을 함께 다뤄야 할 때 mouse
tracking usecase를 사용합니다. 이벤트 경계는 의미 기반으로 유지하고 update
빈도에 따라 데이터를 분리합니다.

```text
pointer event → updatePosition / recordClick → Handler Registry
              → position + movement + activity Store → metric subscription
```

enhanced context-store mouse recipe는 다음 경계를 보여줍니다.

- `contexts/`가 Store, Action, Ref 계약을 소유합니다.
- ViewModel hook은 Store 접근이 주입된 handler 구현을 반환하지만 action을
  직접 등록하지 않습니다.
- `handlers/EnhancedContextStoreHandlerRegistry.tsx`가 5개 mouse action의
  유일한 등록 지점입니다.
- 고빈도 position·movement 데이터와 파생 metric·performance counter를 별도
  store로 분리합니다.
- View는 렌더링할 metric만 구독하고 DOM/canvas 제어는 Ref-aware control hook에
  맡깁니다.

더 낮은 수준의 context-store 변형은 Store 경계를 직접 보여줘야 할 때
사용합니다.

- `context-store-pattern/context/MouseEventsContext.tsx`가 typed Action·Store
  계약과 파생 계산 helper를 정의합니다.
- `context-store-pattern/handlers/MouseEventsHandlerRegistry.tsx`가 6개 이벤트
  등록과 분할 Store 업데이트를 소유합니다.
- `context-store-pattern/providers/MouseEventsProvider.tsx`가 context 정의 밖에서
  Provider 조합을 담당하므로 container는 의미 기반 pointer action만 dispatch합니다.

큰 page-level render tree 전체를 매 pointer event마다 갱신하지 않으면서 관찰
가능한 state가 필요할 때 이 recipe를 사용합니다. action payload는 작게
유지하고 path/history 보관량을 제한하며, 파생 metric 중 즉시 갱신하는 값과
throttle하는 값을 문서화합니다.

## Abortable filtered search usecase

query 의도, filter 전이, 비동기 작업, 결과 선택을 독립적으로 관찰해야 할 때
search usecase를 사용합니다.

```text
query/filter command → performSearch → abort-aware Registry → results + metrics
```

advanced search recipe는 같은 경계를 적용합니다.

- `business/`가 relevance 점수, filtering, history, metric 갱신을 결정적
  함수로 소유합니다.
- `actions/`는 View에 Store mutation을 노출하지 않고 `performSearch`, filter
  command, `selectResult`를 제공합니다.
- Registry가 비동기 search lifecycle을 소유하고 결과를 반영하기 전에
  pipeline signal을 확인합니다.
- query, filters, results, selection, loading, history, metrics를 별도 Store
  concern으로 분리해 각 소비자가 필요한 값만 구독합니다.

새 query가 이전 작업을 대체해야 하거나 filtering과 결과 렌더링을 별도로
측정해야 할 때 이 recipe를 사용합니다. cancellation과 error policy는 input
JSX가 아니라 handler 경계에 둡니다.

## API request gate usecase

중복 요청 차단, rate limiting, 가상 transport 작업, 결과 metric을 독립적으로
관찰해야 할 때 API request management usecase를 사용합니다.

```text
request command → blocking policy → rate-limit policy → transport
                → outcome Registry → request history + metrics Store
```

API Blocking recipe는 같은 경계를 적용합니다.

- `business/api-blocking-rules.ts`가 rate window 정규화, 차단 판단, request
  record 전이, metric 계산을 순수 함수로 소유합니다.
- `actions/useApiBlockingActions.ts`는 View에 raw Store mutation을 노출하지
  않고 `makeApiCall`, configuration, history command를 제공합니다.
- `handlers/ApiBlockingHandlerRegistry.tsx`가 가상 transport, blocking timer,
  rate-limit counter, success/blocked/error 결과 action을 소유합니다.
- `apiCalls`, gate 상태, rate-limit 상태, metrics를 별도 Store로 분리해 각
  View가 렌더링하는 상태만 구독합니다.
- 모든 요청에 `callId`를 부여해 endpoint나 timestamp로 추측하지 않고 정확히
  하나의 pending record를 비동기 결과로 갱신합니다.

double-submit 방지, client-side request gate, 작은 circuit-breaker 데모에 이
recipe를 사용합니다. 정책 판단은 순수 함수로 유지하고 timer와 transport
effect는 Registry에 두며, route는 provider 조합과 feature scope만 담당하게
합니다.

## Virtualized scroll usecase

고빈도 position update, virtualized rendering, 비동기 page loading, DOM
animation의 소유권을 분리해야 할 때 infinite scroll usecase를 사용합니다.

```text
scroll event → position/virtualization command → Handler Registry
             → scroll/content/metrics Store → virtualized View
```

Scroll recipe는 다음 경계를 적용합니다.

- `business/scroll-rules.ts`가 content 생성, velocity 계산, virtualization
  window, page-load metric 전이를 소유합니다.
- `contexts/ScrollContexts.tsx`가 Action·Store·Ref 계약을 정의하며, DOM
  node를 Store에 넣지 않고 Ref Context로 scroll container를 제공합니다.
- `actions/useScrollActions.ts`가 `smoothScrollTo`, `loadMoreContent`,
  `resetScroll` 같은 의미 기반 command를 제공합니다.
- `handlers/ScrollHandlerRegistry.tsx`가 handler 등록, 비동기 loading
  lifecycle, requestAnimationFrame animation, 60fps auto-scroll loop를
  소유합니다.
- View는 scroll data, content, loading, virtualization, metrics를 구독하고
  event handler는 payload 계산과 command dispatch만 담당합니다.

대용량 content surface에서 보이는 window만 렌더링해야 할 때 이 recipe를
사용합니다. virtualization으로 content window를 제한하고, DOM feedback은
Ref 경계에 두며, page-loading 전이는 local component state가 아니라
Store에서 관찰 가능하게 유지합니다.

## Timing strategy comparison usecase

normal, throttle, debounce, leading-edge, trailing-edge 입력 전략을 같은
processing·metric pipeline에서 비교해야 할 때 throttle comparison usecase를
사용합니다.

```text
input event → strategy scheduler → processEvent → event log + metrics Store
             → benchmark / auto-test command
```

Throttle recipe는 다음 경계를 적용합니다.

- `business/throttle-rules.ts`가 metric 전이, 제한된 event history, 기본
  configuration, benchmark history를 순수 함수로 소유합니다.
- `actions/useThrottleActions.ts`가 `inputEvent`, configuration, test command를
  제공하며 View는 scheduler를 선택하거나 `processEvent`를 직접 dispatch하지
  않습니다.
- `handlers/ThrottleHandlerRegistry.tsx`가 다섯 timing scheduler, timeout
  cleanup, 가상 processing, benchmark loop, auto-test timer를 소유합니다.
- `inputEvent`가 의미 기반 경계이며 다섯 scheduler로 fan-out합니다. 결과와
  metric 반영은 `processEvent` 하나의 경계를 사용합니다.

interaction policy 비교나 timing configuration 검증에 이 recipe를 사용합니다.
scheduler state는 Registry가 소유한 ref에 두고 unmount 때 모든 timer를
정리하며, 모든 전략을 같은 result transition에 연결해 비교 가능성을
유지합니다.

## Astryx 연결 경계

Recipe를 Astryx 연결 지점으로 사용합니다.

- neutral canvas와 surface 역할
- semantic accent와 muted selected state
- 장식적인 gradient 대신 낮은 elevation
- 명확한 focus ring과 keyboard-safe control
- 색상만으로 상태를 표현하지 않고 텍스트/의미와 함께 표현
- intrinsic component interaction에만 controlled/uncontrolled 사용

Live Code Editor의 **Usecase boundary** 예제가 이 profile의 기준 구현입니다.

```text
Contract → Runtime → Facade → Recipe → Activity / Result
```

같은 경계를 model-driven 방식으로 확장하려면 [Tool Calling Web Studio
컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)을 사용합니다. 이
recipe는 tool registry, approval policy, provider 중립 model loop, workspace
repository, preview acknowledgement를 runtime에 추가하면서 facade/view 경계는
그대로 유지합니다.

## 검증 게이트

1. domain 순수 함수
2. handler 순서, blocking, abort, result collection
3. facade 파생 값과 command 안정성
4. recipe controlled prop, focus, status
5. 브라우저 happy path와 invalid path
6. 디자인 시스템 primitive의 runtime 직접 import 금지

시작점:

- [Live Code Editor](/example/integrations/live-code-editor)
- [Action Lifecycle Workbench](/example/integrations/action-lifecycle)
- [Access Request Playbook](../examples/access-request-playbook)
