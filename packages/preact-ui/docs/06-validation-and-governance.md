# 06. 계약 검증 규약 및 변경 관리 (Validation & Governance)

> 시점별 릴리즈 후보의 실제 실행 결과표, 테스트 수치 및 번들 크기 측정 기록은 **[릴리즈 코호트 검증 및 변경 이력 (`history/validation-history.md`)](history/validation-history.md)** 에서 분리 관리합니다. 이 문서는 `@context-action/preact` 및 `@context-action/preact-ui`가 항상 충족해야 하는 **항구적 검증 규약과 변경 거버넌스**를 정의합니다.

---

## 6.1 정본(SSOT)과 이력(History) 분리 원칙

1. **역할별 정본 분리**:
   - **공통 규약 (`docs/01` ~ `06`)**: 모든 컴포넌트와 런타임이 준수해야 할 소유권·수명·공개 계약·검증 기준을 버전 꼬리표나 일회성 메모 없이 규범(Normative Specification) 형태로 기술합니다.
   - **개별 컴포넌트 계약 (`component.contract.md` + `public.ts`)**: 개별 위젯의 입력·권한·이벤트·실패 시점과 타입 시그니처를 관리합니다.
   - **이력 아카이브 (`docs/history/validation-history.md` + `CHANGELOG.md`)**: 릴리즈 코호트별 실행 수치, 번들 측정치, 변이(Mutation) 검증 요약을 시점별로 분리 기록합니다.
2. **소급 적용 금지**: 이름이 같은 컴포넌트·이벤트·소스라도 역할이나 버전이 다르면 임의로 합치지 않으며, 신규 API나 제어 모드를 과거 컴포넌트 계약에 암묵적으로 소급 적용하지 않습니다.

---

## 6.2 7대 필수 검증 게이트 구조

| 검증 계층 | 대상 및 목적 | 표준 검증 명령 |
|---|---|---|
| **1. Preact Adapter 계약** | `createDispatchContext`, `connectSourceSignal`, `createSourceContext`, `useProjection` 타입·구독 수명 무결성 | `pnpm --filter @context-action/preact type-check && pnpm --filter @context-action/preact test` |
| **2. UI Runtime 단위/통합 계약** | `mountPreact`, `hydratePreact`, `mountTemplate`, `createDisposalScope`, `definePreactElement`, `createElementFacade`, `createCustomElementBridge`, `createSSR` | `pnpm --filter @context-action/preact-ui type-check && pnpm --filter @context-action/preact-ui test` |
| **3. 순수 DOM 소유권 계약** | 프레임워크 렌더러 없이 Light-DOM/ShadowRoot 임대, 조상·자손 충돌 차단, LIFO 정리 검증 | `pnpm --filter @context-action/preact-ui test:native` |
| **4. 실제 브라우저 계약 (Chromium)** | Shadow DOM 격리, Custom Element upgrade/reconnect, slot 보존, 키보드/포커스, AX 트리 역할·이름, standalone UMD 임베드 | `pnpm --filter @context-action/preact-ui test:browser` |
| **5. 크로스 브라우저 스모크** | Firefox 및 WebKit 엔진에서의 Custom Element, Shadow DOM, FACE, 이벤트 전파 호환성 확인 | `pnpm --filter @context-action/preact-ui test:browser:cross` |
| **6. 패키지 경계 및 Export 계약** | ESM/CJS 듀얼 엔트리(`. `, `./react-bridge`, `./ssr`), 브라우저/process-less 로드, tarball 무결성, 피어 의존성 격리 | `pnpm verify:package-exports && pnpm verify:package-tarballs && pnpm package-boundary:check` |
| **7. 공개 릴리즈 코호트 계약** | 버전·의존성 범위·CHANGELOG·워크플로 일치 여부 및 게시 후 소비자 스모크 검증 | `pnpm verify:preact-public-release -- --require-current-source && pnpm verify:preact-public-workflows` |

---

## 6.3 런타임 보장 불변 조건 (Guaranteed Runtime Invariants)

1. **빈 루트 위임 원칙 (`mountPreact`)**: 자식 노드가 없는 빈 루트(`Element | ShadowRoot`)만 소유하며 기존 호스트 자식 노드를 임의로 삭제하거나 채택하지 않습니다.
2. **명시적 하이드레이션 경로 (`hydratePreact`)**: 서버 렌더링된 자식 노드가 존재하는 루트에서만 호출하며, 내부에 이미 관리 중인 하위 루트가 있으면 중첩 소유를 거부합니다.
3. **렌더 실패 시 자동 세션 정리**: 초기 렌더나 동기 `update`가 예외를 던지면 즉시 해당 인스턴스/세션을 종료하고 소유 루트에 남은 부분 DOM을 제거합니다.
4. **Custom Element 연결 세션 및 영구 정리 (`definePreactElement`)**: 연결 세션(`onConnect` ↔ `onDisconnect`)은 실패한 업데이트나 연결 해제에서도 누수 없이 정리되며, `dispose()`는 연결 해제와 영구 파괴(`onDestroy`)를 모두 수행합니다. Declarative Shadow DOM은 `hydrateShadowRoot: true`와 단일 `[data-preact-root]`가 명시된 경우에만 수화합니다.
5. **공개 멤버(`expose`) 예약어 보호 및 Pre-upgrade 재생**: `expose`는 `ReservedElementKey`를 재정의할 수 없습니다(`ExposeContract` 컴파일 차단 + 생성자 `TypeError` 및 `onDestroy()` 롤백). `upgradeProperties`는 첫 연결 시점에 `expose` setter 또는 프로토타입 setter(예: `name`)로 유실 없이 1회 재생됩니다.
6. **OOP Facade 캡슐화 및 메서드 Identity 안정성 (`createElementFacade`)**: 동결(`Object.freeze`)된 핸들은 원시 `HTMLElement` 프로토타입을 은닉하며, 엘리먼트별 `WeakMap` 캐시를 통해 동일 엘리먼트·동일 메서드에 대해 항상 같은 함수 참조(`===`)를 반환합니다.

---

## 6.4 9대 컴포넌트 계약 검증 범주 및 검증 수준 구분

| 검증 범주 | 최소 확인 항목 |
|---|---|
| **공개 API** | 소비자 엔트리에 VNode, writable Signal, 내부 controller·selector 의존이 없는가 |
| **입력** | 기본값, 제거(`null`), 잘못된 타입·범위, 동일 값 재입력, pre-upgrade 프로퍼티 재생 |
| **권한** | 외부 제어형은 요청만 발행하는가, 승인 전 정본 상태가 변하지 않는가 |
| **이벤트** | `detail` 불변성, 발생 시점, `bubbles`/`composed`, 프로그래밍 입력 에코 방지 |
| **수명** | 연결/해제 반복, 입력·도메인 상태 보존, 단일 구독 유지, 빌린 자원 보존 |
| **소유권** | 호스트 루트/기존 형제/슬롯 콘텐츠 보존, 중첩 제한, owner 내부 ref 사용 |
| **비동기** | 연결 해제·재연결 후 늦은 결과 무시, 취소 권한 범위 준수 |
| **접근성** | 키보드 조작, 접근 가능한 이름, 포커스 이동, `disabled`, 공개 role과 실제 동작 일치 ([R8](references.md#r8)) |
| **배포** | ESM/CJS/타입 선언, DOM 없는 환경 import, 명시적 등록, 태그 충돌 오류 |

- **Node/jsdom vs 실제 브라우저 구분**: jsdom 단위 테스트(`test/*.test.tsx`) 성공을 실제 브라우저 검증으로 대체 보고하지 않습니다. Shadow DOM 슬롯 투영, 포커스, AX 트리 역할·이름(`layer-panel`, `order-workspace`)은 반드시 Chromium 계약 테스트(`test/browser-contract.test.mjs`)와 Firefox/WebKit 스모크(`test/browser-cross-contract.test.mjs`)로 확인합니다.

---

## 6.5 검증 제외 경계 (Consumer-Owned Verification Boundaries)

다음 항목은 라이브러리 런타임의 자동 보증 대상이 아니며 소비자 애플리케이션 환경에서 별도 검증해야 합니다:

- **실제 스크린리더 음성 출력 QA**: NVDA·VoiceOver·JAWS 등 특정 OS·보조기술 조합의 실제 발화 품질은 소비자 제품 QA에서 검증합니다.
- **복합 슬롯·포털 조합**: 단일 슬롯 외에 다중 중첩 슬롯이나 외부 포털을 결합하는 컴포넌트는 개별 `component.contract.md`와 전용 브라우저 테스트를 추가해야 합니다.
- **애플리케이션 레벨 SSR 파이프라인 및 결정론적 ID Prefix**: 서버 라우팅·스트리밍 결합과 서버/클라이언트 간 동일한 `idPrefix` 주입은 호스트 애플리케이션이 보장합니다.

---

## 6.6 변경 영향 관리 절차

공개 프로퍼티 이름뿐 아니라 기본값, 파싱 규칙, 이벤트 의미·전파·시점, DOM 완료 의미, disconnect 보존 정책, CSS 변수/`::part`/slot, 포커스/키보드 동작 변경은 모두 **공개 계약 변경**으로 다룹니다.

```text
변경 제안 → 영향받는 계약 식별 → 타입·문서·구현 정렬
         → 단위/브라우저/Export 계약 검증 → 기존 릴리즈 정책(releases/RELEASE.md)에 따른 반영
```
