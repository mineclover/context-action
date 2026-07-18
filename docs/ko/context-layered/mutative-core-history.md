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
| 원본 프로젝트 | [`unadlib/mutative`](https://github.com/unadlib/mutative) | Mutative 원본 구현과 이슈 이력 |
| 유지보수 포크 | [`mineclover/mutative`](https://github.com/mineclover/mutative) | 유지보수와 upstream 호환 수정의 기준 포크 |
| 편입 revision | [`5fd7d56`](https://github.com/mineclover/mutative/commit/5fd7d56b3f88185ef26908df055a9a27be9a2b88) | `@context-action/mutative-core`에 vendoring한 revision |
| Context-Action 패키지 | [`packages/mutative-core`](../../../packages/mutative-core/) | publish 패키지와 동기화 경계 |

이 revision은 2026-07-18에 준비했으며, 설치 시 별도 빌드가 필요하지 않도록
배포 산출물도 포함한다. 전체 provenance는 패키지의
[`UPSTREAM.md`](../../../packages/mutative-core/UPSTREAM.md)에도 기록한다.

## 반영한 upstream 작업

- [PR #166](https://github.com/unadlib/mutative/pull/166): lazy array draft
  성능, rollback, species constructor, assigned value 수정.
- [Issue #160](https://github.com/unadlib/mutative/issues/160): nested
  `create()` 호출에서 원본 base state의 참조가 노출되지 않도록 미변경
  descendant를 분리.
- [Issue #32](https://github.com/unadlib/mutative/issues/32): Immer 스타일
  호출부를 위한 `create`의 정확한 alias `produce` 추가.

다음 제안은 identity와 replay semantics가 정리될 때까지 core 범위에서
의도적으로 제외한다.

- [Issue #127](https://github.com/unadlib/mutative/issues/127): `move`/`copy`
  연산.
- [Issue #162](https://github.com/unadlib/mutative/issues/162): splice 전용
  patch 표현.
- [Issue #163](https://github.com/unadlib/mutative/issues/163): array 구현
  이후 bundle size 감소 후속 작업.

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

1. 원본 저장소와 유지보수 포크의 새 issue/PR을 검토한 뒤 vendored source를
   변경한다.
2. `mutative-core` 안에 Context-Action 전용 수정을 직접 넣기보다, 검토된
   upstream commit을 가져오는 방식을 우선한다.
3. 편입 commit을 `UPSTREAM.md`, 이 히스토리 문서, package changelog에
   기록한다.
4. core 테스트와 타입 체크를 먼저 실행하고, 그 다음
   `@context-action/mutative`를 빌드한 뒤 React 통합 테스트를 실행한다.
5. adapter 의존성 범위가 바뀌는 release에서는 core 패키지를 먼저 publish한다.
