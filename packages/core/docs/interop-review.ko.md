# 웹 컴포넌트 공통 인터페이스 요구사항 검토

[English](interop-review.en.md) · [소유권·제약](element-interop.md)

상태: Core subpath 설계를 로컬 구현에 채택했습니다. 공개 버전 조합·dependency floor·배포는 승인되지 않았습니다.

| 요구사항 | 공통 책임 / 검증 위치 |
| --- | --- |
| 소비자는 렌더러에 의존하지 않음 | `ElementBridgeContract`와 의미 중심 `CounterHandle`. Host 계약에는 Lit/Preact/Signal 타입 없음 |
| 기존 import·호출 방식 유지 | Preact root·`/react-bridge` facade, Lit 객체형·두 인자형 및 alias 유지 |
| 같은 Action/Ref로 두 구현 연동 | `example/src/pages/integrations/element-interop.contract.test.tsx`: 실제 두 렌더러를 같은 Host로 실행하고 Preact→Lit 교체 |
| 입력 검증·기존 유효 상태 보존 | Facade의 잘못된 입력은 throw하고 이전 확정 값 유지. 검증 정책은 컴포넌트 setter가 소유 |
| 요청과 확정의 권한 분리 | `requestIncrement()`는 동결된 `count-request`만 발생. Host가 확정 input을 다시 넣어야 상태 변경 |
| 프로그래밍 입력 echo 금지 | 초기 input·확정 input·reset은 요청 이벤트를 다시 발행하지 않음 |
| DOM·내부 Signal 비노출 | 명시적 allow-list만 Facade로 노출. Host Ref는 `input/getSnapshot/requestIncrement`만 보유. detach 후 facade 접근 실패 |
| 기본값·제거 규칙 일치 | 건드리지 않은 기본값 보존, bridge가 넣었던 값만 제거 시 초기화. explicit undefined는 대입 |
| 이벤트 수명 일치 | 공통 unit suite와 양쪽 bridge suite: handler identity·교체·StrictMode·unmount cleanup 검증 |
| 설치 후 선언도 공통 계약 유지 | `pnpm verify:element-interop`: 격리 설치된 ESM/CJS 선언, 잘못된 payload·내부 명령·DOM 접근의 음성 타입 검사 |
| Host의 단일 React 런타임 사용 | 공통 구현에 어댑터의 React 전달. 패키지별 개발용 React 버전이 달라도 hook dispatcher를 혼용하지 않음 |
| React 외 Host 수명 | `pnpm verify:element-hosts`: 재사용 가능한 typed Vue 3.5.44 directive·Svelte 5.57.2 action·Angular 20.3.34 standalone directive. 실제 템플릿 정·음성 타입 검사·JSDOM 수명·비활성 서버 shell 검증. 공개 어댑터·hydration·실브라우저 인증은 아님 |
| native 실브라우저 수명 | `pnpm verify:element-host-browser`: 같은 컴파일 소스·실제 framework app·trusted Shadow DOM 클릭·호스트별 17개 검사. 현재 ego Chromium에 한정하며 hydration/FACE/렌더러 조합은 보장하지 않음 |
| DOM/React 분리 | Node-only 기본 entry 선언·프레임워크 미설치 import. DOM binding은 event-before-setter·재진입 dispose·terminal/replayable cleanup 검사 |
| 프레임워크 런타임 결합 방지 | 공통 root는 React/Preact/Lit·HTMLElement 전역 없이 import. 두 UI 패키지가 서로의 렌더러를 의존하지 않음 |
| 배포 안전 | 기존 버전 유지. 공개 Core/UI 배포에는 새 export가 포함된 Core dependency floor·버전 조합 승인 필요 |

이번 공통화는 **소비자와 Host 사이의 전달·명령 경계**입니다. 모든 컴포넌트를 같은
기반 클래스로 만드는 작업이 아닙니다. 스타일 part·slot·접근성·폼 의미·연결 자원
소유권·SSR/hydration·업무 검증은 각 컴포넌트 계약에 남깁니다. 시그니처가 같다는
이유만으로 업무 의미까지 같다고 판단하지 않습니다. fixture처럼 같은 의미 계약을
명시적으로 채택한 구현끼리만 대체 가능합니다.

기존 오류 정책은 구분해 보존합니다. Preact는 property 대입 오류를 throw하고 Lit는
best-effort로 처리합니다. 제거 시 cleanup은 양쪽 모두 best-effort입니다. 공통 구현에
어댑터 정책을 명시적으로 전달하여 서로 다른 실패 의미를 암묵적으로 합치지 않습니다.
Preact의 기본값 보존·listener 재사용 개선은 후보 검증 근거이지 patch release 승인이 아닙니다.

실브라우저 검토에서 기존 Preact showcase가 property를 선언하고도 accessor를 구현하지
않은 문제도 확인했습니다. stepper/badge에 검증·입력 echo 방지를 갖춘 typed
`value/min/max/count` accessor를 추가하고 실제 Shadow DOM 클릭과 Host reset을 테스트합니다.

남는 한계: 저장한 bound method는 revoke되지 않습니다. bridge property 오류에 대한
새 진단 callback은 없고, 생성자와 최초 `connectedCallback` 이벤트는 bridge listener
보다 먼저 발생할 수 있습니다. 반면 bridge snapshot이 일으킨 setter 이벤트는
listener를 먼저 연결한 뒤 전달됩니다. Store의 snapshot/value 읽기 계약도 통합하지
않았습니다. FACE·hydration의 실브라우저 보장은 각 렌더러의 기존 게이트에서 별도로
확인해야 합니다.

Packed ESM/CJS 타입 검사는 각각 독립적인 strict program에서 실행합니다. 현재 Lit UI의
두 선언 그래프를 하나의 TypeScript program으로 함께 가져오면 nominal element class의
`HTMLElementTagNameMap` 선언이 충돌합니다. 이 혼합 모드를 보장한다고 주장하지 않으며,
`skipLibCheck`로 오류를 숨기지도 않습니다.
