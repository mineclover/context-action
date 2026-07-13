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
