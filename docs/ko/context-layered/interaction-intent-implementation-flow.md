# 상호작용 의도 계약에서 Context-Action 구현까지의 흐름

이 문서는 상호작용 의도 계약(IIC)을 Context-Action implementation-playbook과
연결합니다. 디자인 단축, 상태 소유권, 구현 레이어, 검증 증거를 하나의 흐름으로
추적할 수 있게 만드는 것이 목적입니다.

## 전체 흐름

```text
IIC 기록
  → Contexts: 타입이 있는 상태·의도 경계
  → Business: 순수 규칙·전이
  → Handlers: 오케스트레이션·부수 효과
  → Actions: View가 보내는 의미 있는 명령
  → Hooks: 구독·화면 모델
  → Views: control·표현·관찰 가능한 피드백
  → Evidence: 테스트·문서·수동 시나리오·gate
```

affordance를 제거하거나, trigger를 바꾸거나, 사용자의 추론에 의존하는
상호작용은 버튼이나 컴포넌트부터 만들지 않습니다. 먼저 IIC로 디자인 단축을
명시한 뒤 구현 레이어에 배치합니다.

## 기존 컨벤션과의 위계

IIC는 Context-Action의 6개 레이어에 추가되는 런타임 레이어가 아닙니다.
기존 implementation-playbook보다 앞에서 **왜 이 동작을 선택했는가**를 고정하는
상위 설계 계약입니다.

| 위치 | 답하는 질문 | 소유 문서 |
| --- | --- | --- |
| IIC | 무엇을 줄였고, 사용자는 무엇을 예측해야 하는가? | feature spec, decision record, PR |
| Context-Action 6 layers | 그 의도와 상태를 어디에 어떻게 구현하는가? | `contexts / business / handlers / actions / hooks / views` |
| Evidence | 구현 후에도 같은 의도가 유지되는가? | tests, docs, runnable scenario, gates |

따라서 IIC는 기존 컨벤션을 덮어쓰지 않고, 기존 컨벤션이 시작되기 전에 연결되는
설계 source of truth입니다. 작은 예제도 IIC를 먼저 기록하고, 필요한 만큼만
6개 레이어에 매핑합니다.

IIC의 기본 lifecycle은 `draft → accepted → implemented → superseded/deprecated`입니다.
구현이 계약과 달라지면 코드를 먼저 승인하지 않고 IIC와 증거를 먼저 갱신합니다.

## 단계별 책임

| 단계 | Context-Action 위치 | IIC 질문 | 필수 산출물 |
| --- | --- | --- | --- |
| 의도 | feature spec, decision record, PR | 사용자에게 무엇이 편해지고 무엇을 제거했는가? | IIC ID, trigger, 대체 신호, 발견 가능성 위험, 복구 |
| 계약 | `contexts/` | 이 기능의 상태와 의미 있는 의도는 무엇인가? | typed Action/Store/Ref 계약과 baseline state |
| 규칙 | `business/` | 렌더링과 무관하게 이 단축은 무엇을 의미하는가? | 순수 validation·result·state transition 함수 |
| 오케스트레이션 | `handlers/` | 어떤 effect, persistence, logging, reset이 이어지는가? | 명시적 의존성을 가진 Registry handler |
| 명령 | `actions/` | View가 보내는 의미 있는 intent는 무엇인가? | 안정적인 dispatch helper, DOM·비즈니스 규칙 없음 |
| 화면 모델 | `hooks/` | 어떤 상태가 보이고 기준 상태는 무엇인가? | subscription과 파생 label/model |
| 표면 | `views/` | 사용자가 어떻게 trigger하고 관찰하고 복구하는가? | label 있는 control, 결과, keyboard 경로, reset |
| 증거 | tests/docs/gates | IIC의 의미가 아직 유지되는지 어떻게 증명하는가? | 동작 테스트, 상호작용 증거, 문서, 집중 gate |

작은 예제는 모든 폴더를 만들 필요가 없습니다. 대신 IIC 필드와 각 책임의
소유 위치는 문서에 남겨야 합니다.

## 구현 순서

### 1. 코딩 전에 IIC를 기록한다

사용자 목표, 설계 의도, 제거·축약한 affordance, 대체 신호, trigger, 화면 결과,
source of truth, 복구 경로, 트레이드오프, 증거 계획을 기록합니다. `CA-IIC-<번호>`를
사용하고 feature specification 또는 PR에서 연결합니다.

### 2. Context-Action 계약으로 매핑한다

`contexts/`에 상태와 의미 있는 intent를 이름 붙입니다. 비즈니스 명령과
presentation-only 변경을 분리합니다. 자동 실행이어도 submit 버튼이 없다는 이유로
의미 있는 intent를 생략하지 않습니다.

### 3. 규칙을 순수 함수로 만든다

`business/`에 validation, 파생 result, state transition을 둡니다. 브라우저 없이도
IIC를 관찰할 수 있어야 합니다. 기본 상태와 변경 상태를 모두 설명할 수 있어야 합니다.

### 4. Effect는 handler가 조율한다

Handler는 최신 상태를 읽고 business 규칙을 호출한 뒤 Store를 갱신합니다. persistence,
analytics, focus, reset 같은 effect도 handler가 소유합니다. Handler Registry를 통해
등록하고 View에서 규칙을 다시 만들지 않습니다.

### 5. 의미 있는 action과 화면 모델을 노출한다

Action은 저수준 DOM event가 아니라 `changeProbeSettings`, `resetProbe`처럼 사용자
의도를 표현합니다. Hook은 source of truth를 구독하고 현재 값, 상태, 오류, 복구 경로를
View가 렌더링할 모델로 만듭니다.

### 6. 관찰 가능한 최소 표면을 만든다

View는 control, 암묵적 trigger 설명, 현재 결과, reset/cancel 경로를 렌더링합니다.
간결한 상태 알림의 소유자는 하나로 두고, 상세 진단은 개발자 표면으로 분리합니다.
화면 기술 접근성이 필요한 경우 keyboard·focus·semantic·contrast 검증을 같은 IIC의
후속 증거로 연결합니다.

### 7. 합의를 증명한다

기본 시나리오와 하나 이상의 변경 시나리오를 테스트로 고정합니다. 발견 가능성이나
즉시 피드백이 디자인 일부라면 실행 가능한 수동 시나리오도 남깁니다. 구현 위치,
테스트 이름, screenshot 또는 실행 URL, 문서를 IIC에 연결합니다.

## FACE playground 매핑

FACE 예외 playground는 `CA-IIC-FACE-001`을 사용합니다.

- **의도:** 별도 실행 단계 없이 fallback과 native 상태를 비교한다.
- **Trigger:** 폼 값 입력 또는 거부 checkbox 변경.
- **Source of truth:** 실험 결과 카드와 원시 JSON report.
- **대체 신호:** control 설명과 즉시 결과 갱신이 제거한 실행 버튼을 대신한다.
- **복구:** reset이 거부 write 기본 시나리오를 복원한다.
- **Context-Action 매핑:** probe가 시나리오 상태를 소유하고 `run()`이 오케스트레이션 경계가 되며, View control은 의미 있는 input이고 component test가 native write 허용 재실행을 증명한다.

작은 예제에서는 이 매핑이 간단하게 보입니다. 더 큰 기능은 상호작용을 직접적으로
보이게 하려고 View에 비즈니스 규칙을 넣지 말고 같은 책임을 여섯 레이어로 분리합니다.

## 리뷰 체크리스트

- [ ] 구현 전에 IIC ID를 연결했다.
- [ ] 제거·축약한 affordance와 대체 신호를 기록했다.
- [ ] 상태 소유권과 의미 있는 intent를 Context-Action 레이어에 배치했다.
- [ ] 기본·변경 동작을 순수 규칙 또는 component test로 고정했다.
- [ ] View가 암묵적 trigger와 reset/cancel 복구를 설명한다.
- [ ] 상태 알림 소유자를 하나로 정하고 상세 진단을 분리했다.
- [ ] 필요한 화면 기술 접근성 검증을 연결했다.
- [ ] IIC가 문서·테스트·실행 증거·집중 gate를 가리킨다.

## 집중 gate

변경한 경계를 증명하는 최소 gate부터 실행하고 package나 release 경계를 넘을 때
검사를 넓힙니다.

```bash
pnpm convention:check
pnpm docs:management
pnpm llms:check
pnpm docs:build
pnpm --filter @context-action/lit-ui type-check
pnpm --filter @context-action/lit-ui test -- --run test/face-exception-repro.test.ts
```

Canonical Context-Action 예제라면 `pnpm --filter example check`와 해당 시나리오 검증
명령도 함께 실행합니다.
