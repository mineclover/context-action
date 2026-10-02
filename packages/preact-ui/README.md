# @context-action/preact-ui

특정 DOM subtree의 렌더링을 Preact에 위임하고, 외부에서는 공개 인터페이스로만 제어하는 **공개 preview UI runtime**입니다.

```text
Host / <template>       : 배치와 정적 shell
Public controller / CE : 값·명령·이벤트·수명 계약
Preact                 : 위임받은 root.children
@context-action/preact : Action dispatch와 읽기 전용 Signal 연결
Domain                 : 원본 상태와 업무 규칙
```

`mountPreact`는 이미 있는 빈 Root에 렌더러를 연결합니다. `mountTemplate`은 `<template>`을 복제하고 한 개의 빈 `[data-preact-root]`에 연결합니다. `createDisposalScope`는 View → 구독 → 소유한 Model 순서로 자원을 정리합니다.

## 읽는 순서

1. [DOM 소유권 컨벤션](docs/01-dom-ownership.md): 반드시 지킬 경계와 수명 규칙.
2. [적용 가이드](docs/02-integration-guide.md): 패키지 책임과 상태 연결 방법.
3. [공개 API](docs/03-api.md): 입력·출력·실패·해제 계약.
4. [Signals 프로젝션 & 비즈니스 훅 컨벤션](docs/05-signal-projection-convention.md): Context-Layered 관심사 분리와 프로젝션 훅 / 비즈니스 로직 훅 표준.
5. [순수 HTML 이식 & Web Component 아키텍처 리뷰](docs/06-standalone-embed-and-web-components.md): UMD 마운트 vs Web Component 이식 방식 비교 및 실증.
6. [모듈식 Web Component & Signals 통합 컨벤션](docs/07-modular-web-components-and-signals-convention.md): 가상 DOM 격리, 3계층 모듈화, 크로스 시그널 공유 표준.
7. [FACE 및 React 상호운용성 브릿지 가이드](docs/08-form-associated-elements-and-react-bridge.md): 표준 HTML 폼 연동 및 선택적 `@context-action/preact-ui/react-bridge` 컴포넌트.
8. [웹 컴포넌트 인터페이스 설계 및 상태 관리 표준 규약](../lit-ui/docs/05-interface-and-state-management-standards.md): Lit & Preact 공통 인터페이스 작성 규칙, 상태 3계층 모델, 4대 대원칙.
9. [범용 공개 계약](docs/09-public-component-contract.md): 컴포넌트 입력·명령·이벤트의 의미와 소비자 경계.
10. [작성 가이드](docs/10-component-authoring-guide.md): Controller·View·Host adapter의 책임과 Custom Element 작성 순서.
11. [생명주기와 자원](docs/11-lifecycle-and-resources.md): 인스턴스와 connection session, 정리·재연결·비동기 결과 규칙.
12. [계약 검증](docs/12-contract-verification.md): 정적·통합·실제 브라우저 검증 범위와 변경 영향.
13. [Layer Panel 참조 구현](examples/layer-panel/README.md): 하나의 공개 계약을 두 host adapter에 적용한 예제.
14. [SSR entry](docs/03-api.md): `@context-action/preact-ui/ssr`의 server-only render와 `hydratePreact` 계약.

구현은 [examples/](examples/README.md)에 두고, 실제 검증 결과와 남은 범위는 [검증 기록](docs/04-validation.md)에 기록합니다.

## 기본 패키지 범위

템플릿 마운트, 독립 Preact Root, 공유 Source 구독, Core dispatcher 주입, Web Component reference shell을 제공합니다. `definePreactElement`와 React bridge는 기존 선택 기능으로 유지하지만, 범용 컨벤션의 정본이나 필수 경로로 취급하지 않습니다. 공통 runtime은 ownership·mount·disposal처럼 의미를 추론하지 않는 저수준 기능만 제공합니다. Web Component의 업무별 property/event 계약은 예제처럼 작성자가 명시합니다.

`@context-action/preact-ui@0.1.0`은 `@context-action/preact@0.1.0`과 함께
배포하는 공개 preview 패키지입니다. 두 패키지는 `private: false`와
`publishConfig.access: public`을 사용하지만 Core/React 안정 cohort와는 별도의
Preact 공개 cohort로 관리합니다. 0.x 계약이므로 1.0 승격 전 API와 지원 범위가
변경될 수 있습니다.

```sh
pnpm add @context-action/preact-ui preact @preact/signals
```

현재 소스는 ownership, hydration, connection-session, slot, FACE, standalone
browser contract를 검증한 reference runtime으로 공개합니다. 실제 보조기술
조합과 소비자 애플리케이션의 SSR 데이터 경계는 별도 제품 검증 범위입니다.
후보의 검증 명령과 공개 순서는 [검증 기록](docs/04-validation.md) 및
[Preact 공개 preview 릴리즈 계획](../../releases/PREACT_PUBLIC_0.1.0.md)을
따릅니다.
