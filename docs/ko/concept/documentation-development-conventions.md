# 문서 및 개발 관리 컨벤션

이 문서는 문서를 생산하고 검증하기 위한 기준 문서입니다. 사람이 작성하는 원문과
파생 API·LLMS 산출물을 구분합니다. [컨벤션](./conventions.md)의 코딩 규칙을
보완하며, 패키지별 소유권이나 릴리스 규칙을 대체하지는 않습니다.

이슈 lifecycle, 스펙 추적, decision record, 리뷰 handoff는
[스펙·이슈·문서 관리 컨벤션](../context-layered/change-management-convention)을
사용합니다. 이 문서는 문서 생산 규칙을 정의하고, 링크된 컨벤션은 변경을
계획하고 종료하는 방법을 정의합니다.

## 1. 문서 소유권

| 영역 | 소유자 및 편집 규칙 | 검증 |
| --- | --- | --- |
| `docs/en/**`, `docs/ko/**` 가이드·개념 문서 | 사람이 작성하는 원문입니다. 공개 내용은 영문·국문 페이지의 의미를 함께 맞춥니다. | `pnpm docs:build` |
| `docs/api/generated/**` | 생성 API 참조입니다. TypeScript export와 JSDoc을 먼저 고치고, 출력물을 직접 고치지 말고 다시 생성합니다. | `pnpm docs:api`, `pnpm docs:sync` |
| `llmsData/**` 및 생성 LLMS 파일 | 파생 학습·컨텍스트 산출물입니다. 정식 설명의 원문으로 취급하지 않습니다. | `pnpm llms:sync-docs --changed-files <paths>` 후 `pnpm llms:check` |
| README와 패키지 README | 발견과 진입을 위한 문서입니다. 설명을 중복하기보다 권위 있는 가이드 또는 API 페이지로 연결합니다. | 관련 빌드와 링크 검증 |

생성 파일도 리뷰할 수 있지만, 동작 수정은 생성물만 고치지 않고 원문, generator,
또는 export에 반영합니다.
API 소스 링크는 `main` 브랜치를 기준으로 생성합니다. 따라서 커밋 후 문서 파이프라인을
다시 실행해도 커밋 해시만 달라지는 drift가 발생하지 않으며, 소스 경로나 줄이 바뀔 때만
생성 파일이 달라집니다.

## 2. 편집 전 원본 선택

변경하려는 질문에서 출발해 정식 원본을 수정합니다. drift를 발견한 위치가 생성
페이지라고 해서 생성물을 먼저 수정하지 않습니다.

| 변경 | 수정할 정식 원본 | 파생물/갱신 경로 | 최소 증명 |
| --- | --- | --- | --- |
| 공개 가이드 또는 컨벤션 | 짝을 이루는 `docs/en/**`, `docs/ko/**` 페이지 | 영향을 받은 LLMS 요약 재생성 | `pnpm docs:check` |
| export API signature 또는 API JSDoc | TypeScript export와 JSDoc | `pnpm docs:api && pnpm docs:sync` | type check와 `pnpm docs:build` |
| package 발견 경로 또는 소비자 진입점 | package `README.md`와 정식 가이드 링크 | 계약이 바뀐 경우에만 연결된 guide 갱신 | 집중 package 검증 |
| 지속되는 아키텍처 선택 | decision record와 소유 guide/package contract | 구현·테스트 anchor 추가 | 집중 boundary/test 증거 |

`pnpm docs:check`는 문서 관리 metadata, LLMS 최신성, VitePress build를
검증합니다. 이 명령은 정합성을 검사할 뿐 파일을 생성하지는 않습니다.

## 3. 변경 분류

구현 전 변경을 다음 중 하나로 분류합니다.

1. **공개 API** — export type/JSDoc, API 참조 입력, 사용 예제, 그리고 호환성이
   깨질 때의 migration 안내를 갱신합니다.
2. **동작 또는 패턴** — canonical guide, 실행 가능한 예제, 문서의 동작을 증명하는
   테스트를 함께 갱신합니다.
3. **내부 유지보수** — 명령, 소유권, 실패 모드, 기여자 판단 기준이 바뀔 때만
   개발자 문서를 갱신합니다.
4. **생성물 갱신만 수행** — 원문 변경과 generator 명령을 커밋에 밝히며, 생성물을
   독립 기능처럼 설명하지 않습니다.

관련 없는 문서 재작성과 동작 변경을 한 커밋에 섞지 않습니다. 문서만 독립적으로
리뷰할 수 있으면 `docs(<area>):` 커밋을 사용합니다.

## 4. 필수 개발 루프

기능과 유지보수 작업은 다음 순서를 따릅니다.

1. 공개 type, 상태 전이, tool schema, 문서화된 invariant 중 하나로 원본 계약을 정합니다.
2. 계약을 만족하는 최소 구현을 만듭니다.
3. 사용자가 관찰할 수 있는 동작이면 집중 테스트와 실행 가능한 예제를 추가·갱신합니다.
4. 권위 있는 가이드와 발견 링크를 갱신합니다. 공개 페이지의 번역은 의미를 동등하게
   유지하며, 임시 공백은 PR 또는 handoff에 명시합니다.
5. 커밋 전 아래의 변경 비례 검증 게이트를 실행합니다.

문서는 미래 계획이 아니라 현재 동작을 설명해야 합니다. 구현이 미완이면 사용할 수
있는 것처럼 쓰지 말고, 제한과 필요한 증명을 적습니다.

## 5. 검증 게이트

| 변경 | 최소 게이트 | 해당할 때 추가 |
| --- | --- | --- |
| 사람이 작성한 문서 | `pnpm llms:sync-docs --changed-files <paths>` 후 `pnpm docs:check` | 렌더된 상호작용이 바뀌면 집중 link/browser 증명 |
| 공개 TypeScript API | `pnpm type-check` | `pnpm docs:api && pnpm docs:sync` |
| 런타임 동작 또는 프레임워크 패턴 | 집중 패키지 테스트와 `pnpm type-check` | `pnpm test`, example build |
| 예제 앱 또는 브라우저 통합 | `pnpm --filter example build` | 사용자 소유 자격 증명으로 수동 증명, 비밀값 커밋 금지 |
| 릴리스·패키지 도구 | `pnpm verify:package-exports`, `pnpm verify:package-tarballs` | `pnpm verify:private-tools` |
| LLMS/문서 정합성 | `pnpm llms:check` | 리뷰 증거가 필요하면 `pnpm llms:detect-mismatches --output reports/llms-mismatch-report.md` |

독립 실행이 가능한 정식 TypeScript 예제는 `ts` 또는 `typescript` fence 바로 앞에
`<!-- @context-action-compile -->` marker를 붙일 수 있습니다. `pnpm verify:doc-snippets`가
이 marker가 붙은 block을 추출해 빌드된 Core declaration을 기준으로 컴파일하며,
`pnpm verify:all`에도 포함됩니다. marker가 없는 설명용 fragment는 standalone
consumer program으로 취급하지 않습니다.

AI SDK adapter에는 실제 runtime smoke gate인 `pnpm test:ai-sdk-integration`도 있습니다.
이 명령은 local protocol과 adapter를 빌드한 뒤 설치된 AI SDK의 `dynamicTool` 결과를
호출해 approval 및 execution callback 계약을 검증합니다.

`pnpm docs:full`은 API 참조 갱신 파이프라인입니다. TypeDoc을 생성하고 VitePress에
동기화한 뒤 사이트를 빌드합니다. **LLMS 산출물은 재생성하지 않습니다.** 사람이 작성한
가이드 변경에는 해당 원본을 `pnpm llms:sync-docs`로 갱신한 뒤 `pnpm docs:check`를
실행합니다. 릴리스에서 API와 가이드가 함께 바뀌면 두 흐름을 모두 실행합니다.

패키지 빌드, runtime export 로딩, 배포 archive 내용, lint, 테스트, 예제 앱, 문서,
private tooling을 모두 포함한 저장소 전체 pre-merge 검증은 `pnpm verify:all`로
실행합니다.

### 워크스페이스 패키지 빌드 순서

`example`은 `@context-action/core`와 `@context-action/react`를 workspace
패키지의 `dist` 선언과 출력물을 통해 참조합니다. 따라서 패키지 source를
변경한 뒤에는 다음 순서를 지킵니다.

```bash
# 라이브러리 패키지 빌드 (example은 별도)
pnpm build
pnpm example:build

# 집중 검증: core → react → example
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

`pnpm --filter example type-check` 또는 `cd example && pnpm build`만 먼저
실행하면 `packages/*/dist`의 오래된 선언을 읽을 수 있습니다. 그 경우
실제 API 문제가 아닌데도 missing export 또는 타입 오류처럼 보이는 실패가
발생할 수 있습니다.

## 6. 리뷰 및 handoff 기록

문서에 영향을 주는 PR 또는 handoff에는 다음을 적습니다.

- 바뀐 권위 문서와 영향을 받는 생성물;
- 주장을 증명하는 구현·예제·테스트;
- 실행한 명령과 결과;
- 미번역 페이지, 사용할 수 없는 외부 자격 증명, 남은 수동 증명.

이 기록으로 문서 리뷰를 마지막 서식 작업이 아니라 소유권이 명확한 개발 관리
활동으로 만듭니다.

지속되는 동작이나 계약을 추가하는 변경이라면
[변경 관리 컨벤션](../context-layered/change-management-convention)에 따라
issue ID, spec/decision 링크, 구현 anchor, 집중 증거, 후속 작업도 기록합니다.
