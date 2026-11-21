# vNext 아키텍처 & 타 프로젝트 핸드오프 가이드

**상태:** Phase 1 (`M0–M4` 4.x 무중단 정렬) `stage` 구현 완료 — Phase 2 (`v5` 메이저) 피드백·릴리스 윈도우 대기  
**기준선(Baseline):** `stage` 브랜치 (`@context-action/core@1.3.1`, `@context-action/store-core@0.1.4`, `@context-action/mutative-core@0.8.14`, `@context-action/mutative@0.8.15`, `@context-action/react@4.0.7`, `@context-action/lit@0.1.4`, `@context-action/preact@0.1.3`, 프리릴리스 기간 패키지 버전 동결)

이 문서는 연계 프로젝트 또는 후속 세션이 기존 4.x 소비자를 깨뜨리지 않고 협업할 수 있도록 **기준선 규칙 · 필독 지도 · `stage`에 반영된 Phase 1 범위 · Phase 2(`v5`) 유보 결정 게이트 · 재사용 프롬프트 키트**를 정리한 레퍼런스입니다.

---

## 1. 기준선 및 동결 원칙

- **작업 브랜치:** `stage` (릴리스 승인 전까지 `main` 직접 병합·버전 범프·배포 금지).
- **버전 동결 및 4.x 무중단 원칙:** 타 프로젝트·연계 워크스페이스가 현행 `@context-action/*` 4.x / 1.x / 0.x 계약을 사용 중이므로 패키지 버전 및 배포는 동결을 유지하며, **`stage`에 반영된 Phase 1(`M0–M4`) 변경은 전부 루트 `.` export와 기본값을 깨지 않는 Additive 확장**입니다.
- **불필요한 React 훅 래퍼 지양 원칙:** Context-Action은 5가지 OOP × React 기본 Hook 조합 패턴(`useImperativeHandle`, `useLocalStore`/`useReducer`, `useDeferredValue`, React 19 `useOptimistic`/`useTransition`/`useActionState`, isomorphic `useLayoutEffect`/`useEffect`)을 얇은 전용 래퍼 API로 추가하지 않고 **조합 사용 패턴 문서**로 관리합니다.

---

## 2. 필독 문서 지도 (저장소 경로)

설계 피드백을 작성하거나 소비자 코드를 점검할 때 아래 페어링 문서를 순서대로 확인하세요:

1. **vNext 아키텍처 청사진 및 1차 출처 근거 (`proposed`):**
   - [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) — Hub-and-Spoke 목표 구조, 트랙 A/B/C 후보안, 파일·라인 단위 실증 근거, 4.x / v5 단계적 로드맵.
2. **작성 기준 및 단계별 적정 구현:**
   - [모범 사례 (Best Practices)](../guide/best-practices.md) — Level 1(Lite) / Level 2(Headless-First Symmetric DI) / Level 3(Full 6-Layer) 선택 기준 및 CI 강제 7대 규칙(`pnpm convention:check`).
   - [개발 컨벤션 인덱스](./convention-index.md) — 전체 아키텍처·거버넌스 문서 진입점.
3. **코드 패턴 및 OOP × React 기본 Hook 5유형:**
   - [코드 패턴 (Code Patterns)](../guide/code-patterns.md) — 검증된 OOP × React 기본 Hook 패턴 5종 통합 인덱스 (`packages/react/__tests__/patterns/oop-react-hooks-patterns.integration.test.tsx` 검증 연계):
     - [Imperative Handle Facade](../guide/patterns/ref/imperative-handle-facade.md)
     - [로컬 상태 캡슐화 핸들](../guide/patterns/ref/local-state-imperative-handle.md)
     - [지연 뷰 구독 (`useDeferredValue`)](../guide/patterns/store/deferred-view-subscription.md)
     - [낙관적 UI & 전환 (React 19)](../guide/patterns/async/optimistic-and-transition-ui.md)
     - [외부 OOP 라이프사이클 브릿지](../guide/patterns/ref/external-oop-lifecycle.md)
4. **정규 런타임·상태 계약:**
   - [Store별 선택 및 사용법 가이드](./store-selection-and-usage-guide.md)
   - [Core Action Contracts](../../../packages/core/docs/action-contracts.md)
   - [React State Contracts](../../../packages/react/docs/state-contracts.md)

---

## 3. 구현 전 피드백이 필요한 4가지 의사결정 게이트

타 프로젝트 사용 경험을 반영해 [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) 섹션 6의 4가지 질문에 대한 입장을 먼저 정리해 주세요:

1. **기본 `Store` 알림 모드 (`packages/react/src/stores/core/Store.ts:105`):** 구체 `Store` 기본 `notificationMode`를 `'batched'`(16ms RAF)에서 동기 `'immediate'`(`createStateStore()` 및 React 18/19 자동 배칭과 정합, `'raf'` + `RefContext`는 명시적 opt-in)로 바꿀지, 현행 `'batched'`를 유지할지?
2. **`defineRuntime` + `bindReactRuntime` 도입 vs. 순수 분리 철학:** Level 1↔2 전환 보일러플레이트를 줄이는 얇은 통합 팩토리를 도입할지, Action·Store·Ref 독립 선언 명시성을 끝까지 유지할지?
3. **Mutative / TimeTravel 배치:** `Store`·`TimeTravelStore`를 프레임워크 중립 Layer 1 패키지로 분리해 Lit/Preact와 공유할지, Phase 1에서는 `@context-action/react`가 `StateReader<T>` / `StateBackend<T>`를 직접 수용하는 수준으로 멈출지?
4. **Semver 우선순위:** **4.x 무중단(Additive) 확장**을 1차 목표로 잡을지, **v5 메이저 재설계**까지 함께 확정할지?

### 3.1 교차 프로젝트 감사 요약 및 권고 해법 (7개 소비자 저장소)

| 의사결정 게이트 | 7개 실사용 저장소 감사 근거 | 권고 해법 |
|---|---|---|
| **1. 기본 `Store` 알림 모드** | `packages/react/UNRELEASED.md:6-10`에서 4.x 무중단 opt-in `notificationMode?: 'batched' | 'immediate'`가 이미 도입 중이며, 기존 소비자(`iframe-demo`, `graph-hub`, `ae-editor`)의 RAF 타이밍을 보존합니다. | **4.x에서는 `'batched'` 기본 유지** + opt-in `'immediate'` 제공, 기본값 전환은 **v5**에서만 검토 |
| **2. `defineRuntime` / `bindReactRuntime`** | `google-tools`(`runtime.ts:1-24`)·`browser-studio`(`shared.ts:86-90`)는 `{ store, actions, dispose }` 런타임을 반복 래핑하나, `houdini-flow`와 Level 3 앱은 독립 분리를 유지합니다. | **독립 프리미티브 우선 유지** — M1/M3 완료 후 얇은 Level 1↔2 헬퍼 필요성 재평가 |
| **3. `StateBackend` & TimeTravel 위치** | `macrostructure`(`interface-intent-runtime-react.ts:15-32`)는 React 미지원 탓에 `useRef`+`useEffect` 미러 Store를 쓰며, `google-tools`는 Lit만 `StateStore`를 직접 받는 비대칭을 보입니다. `browser-studio`·`ae-editor`(`.mjs`)는 비-React `TimeTravelStore` 수요를 증명합니다. | **M1 (P0):** React 훅·`createStoreContext`의 `StateReader<T>`/`StateBackend<T>` 네이티브 수용<br>**M3 (P1):** Layer 1 프레임워크 중립 타임라인 추출(React `.` re-export 유지) |
| **4. Semver 우선순위** | `ae-editor`, `iframe-demo`, `graph-hub`, `macrostructure`가 모두 `@context-action/react` 루트(`.`)에 직접 의존합니다. | **Phase 1 = 4.x 무중단(Additive) 확정**, 루트 축소·breaking 정리는 **v5 Major**로 분리 |

### 3.2 Phase 1 (4.x 무중단) `stage` 구현 완료 요약 (`M0–M4`)

세부 대상 파일, 계약 목표, 검증 명령은 [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) 섹션 9를 따르며, 아래 5개 Phase 1 마일스톤은 `stage`에 반영·검증이 완료되었습니다 (**Phase 2 / `v5` breaking 정리는 유보**):

- **M0 (`완료` · 기준선 동기화):** `packages/react` 4.x 개선(`StoreNotificationMode`, `useRefController`, `useDebugValue`, OOP 문서) 및 기준선 영수증(`e1bdf4a7`) 커밋.
- **M1a & M1b (`완료` · P0 · 트랙 A1):** `useStoreValue`, `useStoreValues`, `useStoreSelector`, `useStorePath`, `useTimeTravelControls`, `useTimeTravelPath`, `useTimeTravelSelector`, `ExternalStoresMap`(`ExternalStoreInput`), `ExternalTimeTravelStoresMap`(`ExternalTimeTravelStoreInput`)가 `StateReader<T>`/`StateBackend<T>`/`TimelineBackend<T>`를 수동 `BackendStore` 래핑 없이 직접 수용.
- **M2 (`완료` · P1 · 트랙 B1):** `@context-action/core` 제네릭 `ActionRegisterConfig<T>.actions`(`ActionQueuePolicy`, `ActionPolicyConfig`: `queue: 'serial' | 'immediate'`, `timeout?: number`) 및 React `createActionContext` 전달을 4.x 기본값 유지 상태로 구현.
- **M3 (`완료` · P1 · 트랙 A2):** 신규 패키지 증설 없이 `@context-action/mutative` Layer 1 `MutativeStateBackend`/`MutativeTimelineBackend`를 `StateStore`, `TransactionBackend`, 동적 `getNotificationMode()`/`setNotificationMode()`로 정합화하고 React/비-React 상호운용 완성.
- **M4a & M4b (`완료` · P2 · 트랙 C1 & B2):** opt-in React 서브패스(`./refs`[Mutative 독립], `./time-travel`, `./transactions`)와 대칭 디스패치 훅(`useActionResultDispatch()`, `useActionScope()`, `ActionScopeReturn`)을 루트 `.` 100% 보존·`api-surface.v1.json`/경계 게이트 동기화와 함께 반영.

---

## 4. 바로 복사해 지시할 수 있는 프롬프트 키트

### 프롬프트 1 — 타 프로젝트 / 소비자 코드 감사 및 피드백 수집용

```text
현재 이 프로젝트(소비자/연계 워크스페이스)가 `@context-action/*`(`ActionRegister`, `createActionContext`, `createStoreContext`, `createStore`, `StateBackend`/`store-core`, `createRefContext`, `TimeTravelStore`, OOP 브릿지)를 실제로 어떻게 쓰고 있는지 전수 점검해 줘.

아래 context-action `stage` 기준 문서를 대조해서 피드백 리포트를 작성해 줘:
1. `docs/ko/context-layered/decisions/CA-VNEXT-ARCHITECTURE-001.md` (트랙 A/B/C 및 미확정 게이트 4가지)
2. `docs/ko/guide/best-practices.md` (Level 1/2/3 적정 구현 기준)
3. `docs/ko/guide/code-patterns.md` 및 OOP × React 기본 Hook 5가지 패턴

주의: 아직 context-action 라이브러리 계약은 바꾸지 말고, 아래 내용을 구체적으로 정리해 줘:
- 현재 사용 중인 패키지 버전, 서브패스 import, legacy/deprecated 심볼(`useActionEffectHandler`, `compareStrategy` 등) 사용 현황
- 실사용 중 겪은 마찰점(직렬 큐 `{ immediate: true }` 누락 교착, Store `'batched'` RAF 지연 vs 동기 커밋 차이, Level 1->2 이중 선언 보일러플레이트, `store-core` `BackendStore` 래핑, OOP ref 연동 등)
- 4가지 의사결정 게이트 각각에 대한 우리 프로젝트 기준 권장안 및 사전에 조율이 필요한 breaking-change 위험 요소
```

### 프롬프트 2 — `context-action` 최종 설계 확정 및 ADR 승인(`accepted`)용

```text
`context-action` 저장소의 `stage` 브랜치(`docs/ko/context-layered/decisions/CA-VNEXT-ARCHITECTURE-001.md`, `docs/ko/context-layered/vnext-architecture-handoff.md`)를 이어받아 진행해 줘.

수집된 타 프로젝트 피드백을 반영해서:
1. `CA-VNEXT-ARCHITECTURE-001` 섹션 6의 4가지 의사결정 게이트를 최종 결정하고 근거를 보강해 줘.
2. `CA-VNEXT-ARCHITECTURE-001` 상태를 `accepted`로 승격(또는 트랙별 `CA-*` ADR로 분할)하고, 구체 TypeScript 계약·비목표·deprecation 일정을 확정해 줘.
3. 4.x 무중단(Additive) Phase 1부터 착수할 수 있도록 계약 우선(Contract-First) 구현 계획을 수립해 줘 (`catalog/repository-surface/api-surface.v1.json` 및 한/영 문서 동시 갱신 포함).
승인된 릴리스 계획 없이 `main` 병합이나 버전 범프/배포는 진행하지 마.
```

### 프롬프트 3 — 실제 구현 착수 시 검증·거버넌스 가드레일 (후속 작업용)

```text
`stage`에서 Phase 1 또는 vNext 코드 변경을 커밋하기 전 아래 규칙을 반드시 준수해 줘:
- 계약 변경 시 `catalog/repository-surface/api-surface.v1.json`, `packages/*/README.md`, `packages/*/docs/*.md`를 함께 갱신할 것.
- 한/영 문서 페어링을 유지하고 아래 문서·컨벤션·경계 게이트를 전부 통과할 것:
  pnpm docs:llms && pnpm docs:check && pnpm verify:doc-snippets && pnpm convention:check && pnpm package-boundary:check
- 의존성 순서대로 전체 빌드·테스트(`pnpm build && pnpm test`)와 공개 export/타입 변경 시 React 18/19 호환성 게이트를 검증할 것.
- 클린 트리에서 `pnpm verify:quick`(또는 `pnpm verify`)로 `.verification/local-receipt.json`을 갱신하고 `pnpm verify:receipt`가 `✔ [VALID]`를 출력하는지 확인할 것.
- 커밋 메시지에 `CA-SURFACE-CATALOG-001` 및 승인된 `CA-*` ID를 명시하고, `main` 직접 푸시나 직접 배포는 절대 하지 말 것.
```
