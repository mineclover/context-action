# UX 의도·암묵적 합의·접근성 설계 컨벤션

**상태:** Active  
**최근 검토:** 2026-11-01  
**범위:** interactive example, 공개 UI, 데모, workflow view

이 컨벤션은 사용자가 구현을 읽지 않고도 예상해야 하는 동작을 명시합니다.
빠른 조작이나 편리한 UX가 키보드·스크린 리더·포커스·복구 경로를 조용히
잃게 만들지 않도록 UX 의도와 접근성 계약을 같은 기록 단위로 관리합니다.

## 사용할 때

다음 중 하나라도 추가하거나 변경하면 사용합니다.

- 자동 실행, live update, debounce, background feedback
- 새 control, 상태, 오류, reset, recovery 경로
- focus 이동, keyboard 동작, dialog, popover, live region
- 사용자가 서로 다르게 해석할 수 있는 시각 상태
- 확인 단계를 줄이는 대신 명시성이 낮아지는 UX 선택

단순한 시각 변경은 별도 기록이 없어도 되지만, 소유 specification이나 PR에
영향을 받는 접근성 불변 조건은 남깁니다.

## 암묵적 합의 기록

암묵적 합의는 구현을 읽지 않아도 사용자가 예상해야 하는 동작입니다. 예를
들어 “checkbox를 바꾸면 실험이 실행된다”, “최신 결과가 기준이다”, “reset은
재현 가능한 실패 상태로 돌아간다”가 있습니다. 상호작용이나 보조기술 출력에
영향을 주면 구현 전에 기록합니다.

feature specification, decision record, 또는 PR 본문에 다음 형식을 사용합니다.

```text
합의 ID: CA-UXA11Y-<번호>
화면/소유자:
사용자 목표:
암묵적 합의(사용자가 예측할 수 있어야 하는 것):
트리거:
화면에 보이는 결과:
Source of truth:
Reset / cancel / recovery:

접근성 계약:
- semantic control과 accessible name:
- keyboard와 비포인터 경로:
- focus 동작:
- 상태/값/오류 알림:
- 색상·모션·대비·텍스트 대체:

트레이드오프:
- UX 이점:
- 접근성 위험:
- 선택한 해결:
- 배제한 대안과 이유:

증거:
- 구현 anchor:
- 동작 테스트:
- 접근성 또는 keyboard 테스트:
- 필요 시 수동 시나리오/스크린샷:
- 문서 링크:
```

리뷰어가 무엇이 동작을 시작하는지, 화면에서 무엇이 바뀌는지, 키보드와
보조기술 사용자가 같은 변화를 어떻게 발견하는지, 잘못 바꿨을 때 어떻게
복구하는지를 답할 수 있어야 기록이 완료됩니다.

## 설계 규칙

### 1. 자동 동작은 예측 가능하게 만든다

자동 동작은 트리거 가까이에 설명을 둡니다. 어떤 이벤트가 시작하고 어떤
결과를 바꾸는지 씁니다. 이미 자동으로 실행되는 동작을 반복하기 위한 submit
또는 confirm을 추가하지 않습니다.

비용이 크거나 비동기이거나 파괴적인 작업은 debounce, cancel, pending, failure
상태를 함께 정의합니다. “즉시”는 사용자 관점에서 상호작용 계약이 즉시라는
뜻이며, 모든 key 입력이 제한 없이 네트워크 요청을 시작한다는 뜻은 아닙니다.

### 2. 상태 변경마다 알림 출처를 하나만 둔다

같은 결과를 control 상태, result panel, toast에서 모두 읽어주지 않습니다.
간단한 상태 변경은 하나의 live region으로 알리고, 자세한 내용은 결과 화면에
둡니다. live region은 `polite` 또는 `assertive`와 갱신 조건을 명시합니다.

입력 빈도가 높은 control은 매 글자마다 긴 알림을 내지 않습니다. 완료, 오류,
또는 의미 있는 임계값만 알립니다.

### 3. native semantic을 우선한다

가능하면 ARIA role보다 native `button`, `input`, `label`, `fieldset`, `legend`,
`output`을 사용합니다. 모든 control에는 accessible name과 보이는 label이
있어야 합니다. 시각적 toggle은 native value 또는 적절한 ARIA 상태로 같은
상태를 노출합니다.

### 4. 비포인터 경로를 동등하게 보장한다

모든 pointer 동작에는 keyboard 경로가 있어야 합니다. drag, hover, 색상, timing만
으로 현재 상태를 발견하게 하지 않습니다. focus는 보이게 유지하고, 계약상
필요할 때만 자동 이동합니다. 자동 focus에는 이유와 복구 경로를 기록합니다.

### 5. 상태를 색상만으로 표현하지 않는다

색상과 함께 텍스트, label, accessible name이 있는 icon, 또는 구조를 사용합니다.
오류·경고·대기·성공·변경 없음 상태는 monochrome과 high contrast에서도 이해되어야
합니다.

### 6. 사용자 요약과 진단 증거를 분리한다

주 화면은 사용자 언어로 결과를 설명합니다. raw JSON, operation name, trace,
test identifier는 개발자용 surface로 명확히 표시합니다. 외부 테스트나 자동화가
소비하는 machine-readable key는 안정적으로 유지합니다.

### 7. reset과 recovery를 명시한다

control이 시나리오를 바꾸면 기본 상태를 문서화하고 reset 또는 cancel 경로를
제공합니다. reset은 보이는 control과 실제 source of truth를 함께 복구해야 합니다.

## 리뷰 체크리스트

- [ ] 암묵적 합의를 한 문장으로 쓰고 소유자를 정했다.
- [ ] 트리거, 결과, source of truth, reset/recovery를 이름 붙였다.
- [ ] 주 control이 native semantic, visible label, keyboard 경로를 갖는다.
- [ ] focus 동작이 의도적이고 계속 보인다.
- [ ] live region의 범위와 politeness가 명시됐고 중복 알림을 제거했다.
- [ ] 상태 의미가 색상·hover·motion·pointer 정밀도에만 의존하지 않는다.
- [ ] UX 속도/편의의 이점과 접근성 위험을 기록했다.
- [ ] 기본 상태와 변경 상태 하나 이상을 동작 테스트로 고정했다.
- [ ] 같은 경로의 keyboard 또는 접근성 검증을 남겼다.
- [ ] 사용자 문서와 raw diagnostic evidence를 따로 연결했다.

## 증거 기준

변경 유형에 따라 필요한 증거를 최소한 다음과 같이 맞춥니다.

| 변경 | 필요한 증거 |
| --- | --- |
| 새 control 또는 control 동작 변경 | 동작 테스트, keyboard 경로, accessible name 확인 |
| 자동 실행 또는 live update | trigger/result 테스트, 알림 검토, cancel 또는 reset 증거 |
| 오류 또는 validation 상태 | invalid와 recovery 테스트, 색상 외 상태 신호 |
| focus·dialog·popover 동작 | keyboard 순서, focus 도착 위치, escape/cancel 증거 |
| demo 또는 example 전용 상호작용 | 실행 가능한 수동 시나리오와 집중 component 테스트 |

implementation-playbook 작업은 이 기록을 scenario 문서에 연결하고,
`contexts / business / handlers / actions / hooks / views` 계약과 같은 리뷰에
증거를 포함합니다. 이렇게 해야 UX 의도, 상태 소유권, 접근성 동작을 한 번에
검토할 수 있습니다.

## FACE playground 적용 예

### 기록 예시: `CA-UXA11Y-FACE-001`

- **사용자 목표:** 거부 조건을 바꿔 fallback과 native 상태 차이를 즉시 비교한다.
- **암묵적 합의:** 입력이나 체크를 바꾸면 현재 설정으로 실험이 다시 실행된다.
- **접근성 계약:** native `input`과 `label`을 사용하고, 결과 패널 하나만 `aria-live="polite"`로 진단 건수를 알린다.
- **트레이드오프:** 실행 버튼을 없애 조작 단계를 줄이는 대신, 트리거 근처 설명과 reset 경로를 제공한다.
- **증거:** `run()` 재실행 component test, 실행 가능한 playground, 원시 JSON report.

FACE 예외 playground는 다음과 같이 이 컨벤션을 적용합니다.

- text input 또는 rejection checkbox 변경이 트리거다.
- 실험 결과 카드가 현재 실행의 source of truth다.
- 하나의 간결한 live status가 진단 작업 수만 알린다.
- raw JSON은 개발자 증거로 표시하고 API key는 유지한다.
- reset control은 기본 거부 시나리오를 복구한다.
- component test가 native write를 허용한 재실행을 검증한다.

작은 예제라도 새로운 암묵적 상호작용 합의를 추가할 때 이 기록을 복사해
사용합니다.
