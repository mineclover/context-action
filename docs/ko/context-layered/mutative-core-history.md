# Mutative Core 히스토리 및 원본 참조

**상태:** `@context-action/mutative-core` 활성 참조 문서
**범위:** 소스 계보, 반영한 수정, 라이선스, 동기화 규칙

`@context-action/mutative-core`는 Context-Action runtime adapter가 사용하는
하위 immutable-update engine이다. upstream 호환성을 유지하는 독립 경계로
관리하며, TimeTravel 같은 Context-Action 전용 helper는
`@context-action/mutative`가 소유한다.

## 소스 계보

| 단계 | 참조 | 역할 |
| --- | --- | --- |
| 원본 / 활성 upstream | [`unadlib/mutative`](https://github.com/unadlib/mutative) (`v2.0.2`) | 활성 upstream Mutative 구현체 |
| upstream 호환성 기준 | `mutative@2.0.2` ([`15caa67b`](https://github.com/unadlib/mutative/commit/15caa67b2a15430d2d981c770bf7821d1beca3fa)) | npm tarball과 source `gitHead`를 `upstream-lock.json`에 기록 |
| 이전 포크 계보 (대체됨) | [`mineclover/mutative`](https://github.com/mineclover/mutative) ([`5fd7d56`](https://github.com/mineclover/mutative/commit/5fd7d56b3f88185ef26908df055a9a27be9a2b88)) | `v2.0.2` 편입 전 `mutative@1.3.0` 위에 유지하던 초기 배열/컬렉션 포크 |
| Context-Action 패키지 | [`packages/mutative-core`](https://github.com/mineclover/context-action/tree/main/packages/mutative-core) | publish 패키지와 동기화 경계 |

`1.3.0` 포크 기준선에서 `mutative@2.0.2`로 업그레이드하면서 upstream의
네이티브 `src/array.ts`, Map/Set 동결 및 이터레이터 수명 수정, 프로토타입 오염
방어 `apply()`, 공유 draft finalization 수정
([PR #213](https://github.com/unadlib/mutative/pull/213),
[PR #218](https://github.com/unadlib/mutative/pull/218))을 흡수했습니다.
이로써 전체 28개 `src/` 파일 중 24개를 upstream과 바이트 동일하게 유지하고
로컬 변경 파일을 13개에서 4개로 축소했습니다.

인수한 upstream `mutative@2.0.2` npm tarball integrity, source-tree hash,
local modified/unchanged inventory는
[`upstream-lock.json`](../../../packages/mutative-core/upstream-lock.json)에
기록합니다. 전체 provenance는 패키지의
[`UPSTREAM.md`](../../../packages/mutative-core/UPSTREAM.md)에도 기록합니다.

## 유지 중인 Context-Action 로컬 패치 계약

`mutative@2.0.2` 위에서 다음 3가지 경량 계약만 의도적으로 유지합니다:

- `produce-alias` (`src/index.ts`): Immer 스타일 호출부를 위한 `create`의
  정확한 alias `produce` export ([Issue #32](https://github.com/unadlib/mutative/issues/32)).
- `nested-create-and-strict-return` (`src/makeCreator.ts`): 중첩
  `create(draft, ...)` 시 미변경 하위 트리가 바깥 원본을 오염시키지 않도록
  `deepClone(current(base))`로 분리하고([Issue #160](https://github.com/unadlib/mutative/issues/160)),
  `rawReturn()` 없는 `strict: true` 비-draft 직접 반환을 거부합니다.
- `set-order-and-lossless-paths` (`src/patch.ts`, `src/utils/draft.ts`):
  undo/redo에서 삽입 순서를 보존하는 Set 단위 `replace` patch를 유지하고,
  dev/prod 모두에서 `pathAsArray: false` 비문자열 Map key·Symbol path를 차단합니다.

## Context-Action adapter 계약

`@context-action/mutative`는 별도의 immutable-update engine을 유지하지 않고
core 동작을 그대로 전달하는 Context-Action adapter다.

- `produce(..., { freeze: true })`는 core `enableAutoFreeze`로 전달하며,
  `strict`는 독립적으로 전달되어 비-draft replacement를 거부한다.
- `produceWithPatches`는 core tuple
  `[state, patches, inversePatches]`를 반환한다. Set 변경은
  `replace` patch로 표현하여 undo/redo에서 삽입 순서를 보존한다.
- `createTimeTravel`은 `enableAutoFreeze`, `strict`, `patchesOptions`를
  전달한다. 문자열 patch 경로는 문자열 속성과 문자열 Map key에만 유효하다.
  숫자/객체 Map key와 Symbol 속성은 array path를 사용해야 하며, 그렇지
  않으면 명시적으로 실패한다.
- Time-travel listener는 전체 history와 현재 transition의 patch를 분리해
  전달하므로 React path subscription이 매 업데이트마다 과거 patch를 다시
  처리하지 않는다.
- `enableAutoFreeze`는 object, array, Map, Set shell을 freeze하고 일반
  mutator를 차단한다. `Map.prototype.set.call(map, value)`와 같은 직접
  prototype 호출은 JavaScript collection의 escape hatch로 남는다.

## 라이선스와 attribution

vendored core는 Mutative 원본과 동일하게 **MIT 라이선스**를 유지한다.
Context-Action adapter는 별도로 Apache-2.0 라이선스를 사용하며 upstream
라이선스를 바꾸거나 덮어쓰지 않고 core 패키지에 의존한다. 소스 동기화 때마다
[`packages/mutative-core/LICENSE`](../../../packages/mutative-core/LICENSE)와
원본 참조를 함께 유지한다.

## 동기화 규칙

1. [`unadlib/mutative`](https://github.com/unadlib/mutative)의 새 issue/PR을
   검토한 뒤 vendored source를 변경한다.
2. `mutative-core` 안에 Context-Action 전용 수정을 직접 넣기보다, 검증된
   upstream 릴리즈를 가져오는 방식을 우선한다.
3. 편입 릴리즈를 `UPSTREAM.md`, `upstream-sync.json`, 이 히스토리 문서,
   package changelog에 기록한다.
4. core 테스트와 타입 체크를 먼저 실행하고, 그 다음
   `@context-action/mutative`를 빌드한 뒤 React 통합 테스트를 실행한다.
5. adapter 의존성 범위가 바뀌는 release에서는 core 패키지를 먼저 publish한다.

release 전에는 다음 동기화 verifier를 실행합니다.

```bash
pnpm verify:mutative-upstream
```

이 verifier는 정확한 upstream tarball을 내려받아 SHA-512 integrity와 모든
`src` 파일 hash를 검증한 뒤 committed lock inventory와 local fork를 비교합니다.
읽기 전용이므로 vendored source를 자동으로 덮어쓰지 않습니다. `--inventory`로
후보를 확인하고 lock과 provenance를 검토·commit한 뒤 `--check`를 다시 실행합니다.
upstream baseline `2.0.2`, Mutative Core `0.8.14`, scoped adapter `0.8.15`는
별도 release 계약입니다.
