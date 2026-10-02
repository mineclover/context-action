# 검증 기록

기준일: 2026-10-02. 이 기록은 공개 preview 후보 작업 트리에서 실행한 결과를
기록한다. `@context-action/preact@0.1.0`과 `@context-action/preact-ui@0.1.0`은
`private: false`, `publishConfig.access: public`인 별도 공개 cohort이며 Core/React
stable cohort에는 포함하지 않는다.

## 현재 수행한 검증

| 범주 | 명령 | 결과 |
|---|---|---|
| Preact adapter | `pnpm --filter @context-action/preact test` | 4 tests passed |
| Preact adapter types | `pnpm --filter @context-action/preact type-check` | passed |
| Preact UI runtime | `pnpm --filter @context-action/preact-ui test` | 64 tests passed |
| Preact UI types | `pnpm --filter @context-action/preact-ui type-check` | passed |
| DOM-only ownership logic | `pnpm --filter @context-action/preact-ui test:native` | 13 tests passed |
| Chromium contract | `pnpm --filter @context-action/preact-ui test:browser` | passed |
| Firefox/WebKit smoke | `pnpm --filter @context-action/preact-ui test:browser:cross` | Firefox 155 / WebKit 26.6 passed locally (2026-10-02) |
| Standalone output | `build:standalone` + `sync:standalone` | ESM/IIFE/UMD built |

Chromium 검증에는 Layer Panel의 template island와 Custom Element 소유권,
slot 보존, disconnect/reconnect, keyboard/focus, accessible button name,
standalone vanilla embed의 `customerName = '이순신 (조선 수군)'` property 반영을
포함한다. Projected Order Workspace에서는 Shadow DOM 내부의 새 상품 입력
`label`/`id` 연결, 상품 없음 오류의 `role="alert"`와 목록
`aria-describedby` 연결, 수량 변경의 `role="status"`/`aria-live`, activity
log 토글의 `aria-expanded`/`aria-controls`와 로그 이름도 확인한다. 브라우저
검증은 Chromium 접근성 스냅샷, DOM 접근성 속성, 실제 키보드 동작을 함께 확인하지만 NVDA, VoiceOver 같은 실제
보조기술 조합의 음성 출력을 보증하지 않는다.

## 현재 계약

- 일반 mount는 빈 위임 root만 소유하고 기존 host children을 지우지 않는다.
- hydration은 서버 children이 있는 root에서만 명시적으로 호출한다. hydration
  root 안에 이미 관리 중인 하위 root가 있으면 중첩 소유를 거부한다.
- mount/hydrate update가 동기 render 오류를 내면 해당 instance/session을
  종료하고 소유 root의 부분 DOM을 정리한다.
- `definePreactElement`의 연결 session은 실패한 update/disconnect에서도
  정리되며 `dispose()`는 disconnect와 permanent destroy를 모두 시도한다.
- hydration mismatch는 Preact의 일반 reconciliation 결과를 따른다. 현재
  계약은 mismatch를 오류로 승격하거나 특정 경고 문구를 보장하지 않으며,
  서버와 클라이언트 입력을 애플리케이션이 맞추는 것을 요구한다.
- `definePreactElement`의 DSD hydration은 `hydrateShadowRoot: true`와 기존
  ShadowRoot 내부의 단일 `[data-preact-root]`를 함께 지정한 경우에만 동작한다.
  기본 mount 경로는 기존 ShadowRoot를 자동 채택하지 않고 fail-closed한다.
- Layer Panel의 `suffix` named slot은 Chromium에서 assigned node 교체,
  `slotchange`, assigned node identity, fallback 표시까지 검증한다. 이 증거는
  해당 component contract에 한정되며 임의의 다중 slot/portal 조합을 보장하지 않는다.

## 남은 검증 범위

- NVDA/VoiceOver 음성 검증은 라이브러리 runtime 기능이나 release gate가 아니다.
  라이브러리는 Chromium AX, Firefox/WebKit smoke, DOM semantics, keyboard 계약을
  검증하며, 소비자 제품이 특정 OS·보조기술 조합을 지원하기로 선택한 경우에만
  별도 QA 절차로 추가한다.
- 다른 컴포넌트의 복합 projection은 각 component contract와 브라우저 테스트를
  함께 추가해야 한다. Layer Panel suffix slot 외의 다중 slot/portal 조합은
  여전히 소비자 환경에서 별도 검증한다.
- SSR 문자열 생성과 `hydratePreact`의 기본 fixture는 Vitest/jsdom과 Chromium
  `ssr-browser.html` 경로에 포함되어 있다. 애플리케이션의 서버 데이터·라우팅·
  streaming 조합은 아직 소비자 환경에서 별도 검증한다.
- Projected Order의 light-DOM adapter는 mount마다 고유한 `idPrefix`를 주입한다.
  직접 SSR/hydration으로 `OrderWorkspaceView`를 사용할 때는 서버와 클라이언트가
  같은 deterministic prefix를 전달해야 label·description·controls ID가 일치한다.
- 예제의 semantic public API는 component owner가 정의한다. 공통 factory가
  `customerName`, commands, events 같은 업무 의미를 추론하지 않는다.

## 재현 명령

```sh
pnpm --filter @context-action/preact type-check
pnpm --filter @context-action/preact test
pnpm --filter @context-action/preact-ui type-check
pnpm --filter @context-action/preact-ui test
pnpm --filter @context-action/preact-ui test:native
pnpm --filter @context-action/preact-ui test:browser
```

예제 산출물은 `packages/preact-ui/example-dist`에 생성되며 npm artifact에
포함하지 않는다. 공개 후보의 package export와 tarball 검증은 다음 명령으로
재현한다.

```sh
pnpm verify:package-exports
pnpm verify:package-tarballs
pnpm package-boundary:check
```

공개 후보는 [`PREACT_PUBLIC_0.1.0.md`](../../../releases/PREACT_PUBLIC_0.1.0.md)의
보호된 publication workflow에서 `@context-action/preact` 다음
`@context-action/preact-ui` 순서로 게시한다.
