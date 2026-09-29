# 초기 템플릿 검증 기록

검토 기준: `mineclover/context-action`의 `a1644815b5434279e34fbfcaecb7951fdd01fb2f`. 기록일: 2026-09-29.

## 저장·전달 상태

`feat/preact-runtime-template-20260929` 브랜치는 생성됐지만 여전히 위 기준 커밋을 가리킵니다. GitHub 파일 업로드 중 도구의 보안 판정 차단이 발생해 새 소스 커밋과 PR을 만들지 못했습니다. main 변경과 병합은 없습니다. 초기 Git tree 객체 일부의 생성은 브랜치에 파일이 반영된 것을 뜻하지 않습니다.

이 문서와 소스는 ZIP/패치로 전달하는 **아직 저장소에 적용되지 않은 변경본**입니다. 저장소 전체 사본이 아니며 변경 파일만 포함합니다.

## 실제 수행한 검증

| 검증 | 결과 | 한계 |
|---|---|---|
| 새 TypeScript/TSX 19개 파일 구문 변환 | 오류 0 | 로컬 TypeScript 5.8.3의 transpileModule. 외부 타입 호환 검증 아님 |
| ownership.ts / disposal-scope.ts strict 타입 검사 | 통과 | 외부 의존성 없는 2개 모듈만 검사. workspace TypeScript 6.0.3 검사 아님 |
| test/native-contract.test.mjs | 12개 통과, 0개 실패 | Node 22.16.0, NodeDouble 기반 로직 테스트. 실제 DOM/Preact 테스트 아님 |
| Chromium 검증 시도 | 완료 결과 없음 | 실행이 timeout되어 브라우저 성공 증거로 사용하지 않음 |

Native 검사는 `test:native` 스크립트와 동일한 tsc/Node 명령을 로컬에서 직접 실행했습니다. Native 단위 테스트는 중복/중첩 lease, 기존 children 보존, lease 재사용, LIFO cleanup, cleanup 실패 집계, dispose 이후 등록을 확인합니다.

## 남아 있는 병합 차단 항목

**새 workspace 항목에 대응하는 pnpm-lock.yaml을 아직 갱신하지 못했습니다.** 따라서 이 변경본을 적용하면 새 workspace 의존성과 기존 lockfile이 불일치합니다. 변경본은 frozen-lockfile 설치와 병합 준비가 완료된 상태가 아닙니다. 원격 브랜치 자체는 아직 변경본이 적용되지 않은 기준 상태입니다.

로컬에 pnpm과 프로젝트 의존성이 없고, GitHub/npm 호스트의 DNS 접근이 실패했습니다. 실행 환경도 저장소의 Node 24.11+/TypeScript 6.0.3 기준과 다릅니다. 의존성 해석·설치, 전체 타입 검사, tsdown ESM/CJS/선언 빌드, 작성한 Vitest 런타임 테스트, 예제 브라우저 검증은 미수행입니다. 결과를 추정하거나 통과 처리하지 않았습니다.

`preact` 10.27.3은 저장소의 기존 override 기준을 따랐습니다. `@preact/signals` 2.11.2는 공식 저장소의 패키지 선언을 확인했지만, 이 실행 환경에서 npm 배포본 설치까지 확인한 것은 아닙니다. 설치 시 정확한 해석 결과와 peer 정합성을 확인해야 합니다.

## 재개 순서

먼저 ZIP의 APPLY.md에 따라 패치를 검토·적용합니다. 다음 순서로 진행하고 소스 변경본과 갱신된 lockfile을 작업 브랜치에 함께 커밋합니다. lockfile을 수작업으로 축약하거나 기존 release/security gate를 완화하지 않습니다.

```sh
pnpm install --no-frozen-lockfile
pnpm --filter @context-action/core build
pnpm --filter @context-action/preact type-check
pnpm --filter @context-action/preact build
pnpm --filter @context-action/preact test
pnpm --filter @context-action/preact-ui type-check
pnpm --filter @context-action/preact-ui build
pnpm --filter @context-action/preact-ui test
pnpm --filter @context-action/preact-ui test:native
pnpm --filter @context-action/preact-ui examples:build
pnpm package-boundary:check
pnpm verify:package-exports
```

그다음 `examples:dev`에서 template 갱신/해제, 공유 모델의 두 View 동기화, Custom Element pre-upgrade property, disconnect/reconnect, boolean attribute, event echo 방지를 실제 브라우저로 확인합니다. 패키지 import의 DOM 없는 환경 안전성과 번들 내 중복 Preact/Signals 포함 여부도 확인합니다.

전체 저장소 회귀와 보호된 검증 파이프라인은 별도로 실행해야 합니다. 신규 두 패키지는 `private: true`, `0.0.0`이며 npm 배포, stable cohort 편입, 승인, 병합을 수행하지 않았습니다.
