# 릴리즈 코호트 검증 및 변경 이력 (Validation & Release History)

이 문서는 `@context-action/preact` 및 `@context-action/preact-ui` 공개 코호트의 **시점별 검증 실행 기록, 번들 풋프린트 측정치, 그리고 아키텍처 이터레이션 결정 이력**을 보관합니다.

항구적 런타임 보장 규약과 검증 경계는 정본 스펙인 [`06-validation-and-governance.md`](../06-validation-and-governance.md)에서 관리합니다.

---

## 1. `0.2.0` 코호트 후보 검증 기록 (기준일: 2026-10-18)

- **대상 패키지**: `@context-action/preact@0.1.2` + `@context-action/preact-ui@0.2.0`
- **릴리즈 계획서**: `releases/PREACT_PUBLIC_0.2.0.md` (`preact-public-2026-10.json`)

### 1.1 필수 검증 게이트 실행 결과

| 범주 | 실행 명령 | 결과 |
|---|---|---|
| Release contract | `pnpm verify:preact-public-release -- --require-current-source` | `ok` (`0.1.2` / `0.2.0`) |
| Release workflows | `pnpm verify:preact-public-workflows` | `ok` (19 tests passed) |
| Preact adapter | `pnpm --filter @context-action/preact type-check` / `test` | passed / 4 tests passed |
| Preact UI runtime | `pnpm --filter @context-action/preact-ui type-check` / `test` | passed / 76 tests passed (12 files) |
| DOM-only ownership logic | `pnpm --filter @context-action/preact-ui test:native` | 13 tests passed |
| Chromium contract | `pnpm --filter @context-action/preact-ui test:browser` | passed |
| Firefox/WebKit smoke | `pnpm --filter @context-action/preact-ui test:browser:cross` | Firefox / WebKit passed |
| Package exports | `pnpm verify:package-exports` | 79 targets (`.` 및 `./ssr` process-less load 포함) |
| Tarballs / boundaries | `pnpm verify:package-tarballs` / `pnpm package-boundary:check` | 13 tarballs / violations 0 |

### 1.2 `0.2.0` 주요 아키텍처 반영 및 변이(Mutation) 검증 이력

1. **선언적 `expose` 및 예약 멤버 이중 방어 (`custom-element.ts`)**:
   - `definePreactElement<Input, Expose>`에 `expose` 디스크립터 자동 설치 및 `PreactCustomElementConstructor<Input, Expose>` 반환 타입 도입.
   - `ReservedElementKey`(`keyof ManagedPreactElement<unknown>`)와 `ExposeContract<Expose>` 자기참조 제약으로 컴파일 타임 예약어 재정의 차단.
   - 생성자 런타임에서 프로토타입 체인(`key in ManagedElement.prototype`) 대조 후 충돌 시 부분 설치 전 `TypeError` 발생 및 `onDestroy()` 롤백(`AggregateError` 병합).
2. **Pre-upgrade 프로퍼티 재생 보강 (`custom-element.ts`)**:
   - `expose`가 정의하지 않은 `upgradeProperties` 항목(예: `name`)도 own data property 삭제 후 프로토타입 setter로 정상 재생되도록 수정.
3. **호스트 중립 OOP Facade 모듈 분리 (`facade.ts` & `react-bridge.ts`)**:
   - `PublicActionMethods`, `ImperativeHandleFactory`, `createElementFacade`를 외부 런타임 무의존 모듈인 `src/facade.ts`로 분리하여 `@context-action/preact-ui`(루트)와 `@context-action/preact-ui/react-bridge` 양쪽에서 export.
   - 이로써 `./react-bridge` 번들이 `preact`나 `custom-element` 런타임 청크를 끌어오지 않고 순수 `react` + `facade`만 로드하도록 청크 결합 해소.
   - `createElementFacade`에 엘리먼트별 `WeakMap` 바운드 메서드 캐시를 적용하여 `facade.method === facade.method` 참조 동일성 보장.
4. **레퍼런스 예제 모듈화 (`examples/projected-order/`)**:
   - 단일 파일(`order-element.tsx`)에 혼재되어 있던 공개 계약·핸들(`order-contract.ts`), 연결 세션(`order-session.ts`), 엘리먼트 등록(`order-element.tsx`)을 3개 모듈로 분리하고 `createOrderWorkspaceHandle`을 `createElementFacade` 기반으로 일원화.
5. **회귀 테스트 변이 검증 (`test/expose-contract.test.ts`)**:
   - 세 가지 런타임 보강(예약 멤버 `TypeError` + `onDestroy`, 프로토타입 setter pre-upgrade 재생, Facade 메서드 identity 캐시) 각각을 되돌리는 mutation 적용 시 대응 테스트가 즉시 실패함을 확인.

### 1.3 Standalone 번들 크기 측정치 (`0.2.0` 기준)

`pnpm --filter @context-action/preact-ui build:standalone` 실행 결과(Preact 10.27.3, `@preact/signals` 2.11.3, `@context-action/core`, `@context-action/preact`, `@context-action/preact-ui`, `<order-workspace>`, `<cart-badge>`, `<cart-drawer>` 자체 포함):

```text
dist-standalone/
├── order-workspace.umd.js   약 115.6 kB (gzip: 약 33.1 kB)
├── order-workspace.iife.js  약 115.5 kB (gzip: 약 33.1 kB)
└── order-workspace.es.js    약 117.5 kB (gzip: 약 33.2 kB)
```

---

## 2. `0.1.0` 공개 Preview 검증 기록 (기준일: 2026-10-02)

- **대상 패키지**: `@context-action/preact@0.1.0` + `@context-action/preact-ui@0.1.0`
- **릴리즈 계획서**: `releases/PREACT_PUBLIC_0.1.0.md`
- **초기 아키텍처 검토 기준 커밋**: `a1644815b5434279e34fbfcaecb7951fdd01fb2f`

### 2.1 필수 검증 게이트 실행 결과

| 범주 | 실행 명령 | 결과 |
|---|---|---|
| Preact adapter | `pnpm --filter @context-action/preact test` | 4 tests passed |
| Preact adapter types | `pnpm --filter @context-action/preact type-check` | passed |
| Preact UI runtime | `pnpm --filter @context-action/preact-ui test` | 64 tests passed |
| Preact UI types | `pnpm --filter @context-action/preact-ui type-check` | passed |
| DOM-only ownership logic | `pnpm --filter @context-action/preact-ui test:native` | 13 tests passed |
| Chromium contract | `pnpm --filter @context-action/preact-ui test:browser` | passed |
| Firefox/WebKit smoke | `pnpm --filter @context-action/preact-ui test:browser:cross` | Firefox 155 / WebKit 26.6 passed locally (2026-10-02) |
| Standalone output | `build:standalone` + `sync:standalone` | ESM/IIFE/UMD built (약 114.4 kB / gzip 32.7 kB) |
