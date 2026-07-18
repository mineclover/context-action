# 스펙·이슈·문서 관리 컨벤션

**상태:** Active
**최종 검토:** 2026-07-17
**범위:** 기능 개발, 아키텍처 변경, 버그 수정, 공개 문서

이 문서는 요청을 검증된 변경으로 연결하는 운영 계층을 정의합니다.
[구현 컨벤션](./implementation-convention),
[문서 및 개발 관리 컨벤션](../concept/documentation-development-conventions),
[아키텍처 거버넌스와 증거](./architecture/architecture-governance)를 보완합니다.

## 리뷰 판정

현재 저장소는 구현과 검증 컨벤션이 잘 정리되어 있습니다.

- `contexts`, `business`, `handlers`, `actions`, `hooks`, `views` 간
  Context-Layered 소유권이 명시되어 있습니다.
- tool-calling 작업은 `tools/list` → model tool call → `tools/call` →
  structured result 순서를 기준으로 합니다.
- 실행 가능한 예제에 집중 컨벤션 검사와 browser gate가 있습니다.
- 공개 문서와 생성 문서의 소유권이 분리되어 있습니다.
- 아키텍처 거버넌스가 capability와 구현 anchor, 테스트 증거, 공개 문서를
  연결할 수 있습니다.

남은 관리 리스크는 traceability입니다. 이슈는 의도를 기록하고 스펙은 계약을
기록하지만, 둘 중 어느 것도 commit message나 완료된 diff에서 역추론해서는
안 됩니다. 아래 규칙으로 이 연결을 명시합니다.

## 1. 원본 기준 계층

각 산출물은 서로 다른 질문에 답합니다. 한 산출물이 다른 산출물을 암묵적으로
대체하게 두지 않습니다.

| 산출물 | 답하는 질문 | 반드시 포함 | 되어서는 안 되는 것 |
| --- | --- | --- | --- |
| 이슈 | 왜 필요한가, 누가 담당하는가, 결과는 무엇인가? | owner, 범위, 제외 범위, acceptance criteria, 의존성 | 완성된 기술 설계 전체 |
| 스펙 | 어떤 계약이 계속 참이어야 하는가? | type, 전이, invariant, 호환성, migration, 실패 동작 | 작업 체크리스트나 진행 로그 |
| 코드·테스트 | 계약이 실제로 동작하는가? | 구현 anchor와 실행 가능한 증거 | 사용자 동작에 대한 유일한 설명 |
| 공개 문서 | 사용자·기여자가 어떻게 이해해야 하는가? | 현재 동작, 사용법, 제한, 검증 경로 | 아직 구현되지 않은 미래 설계 |
| Architecture registry/decision | 어떤 경계가 안정적이고 누가 소유하는가? | capability identity, owner, evidence, 결정 기록 | 의미 없는 파일 목록 |
| 생성물 | 어떤 파생 산출물을 배포하는가? | generator 원본과 재현 명령 | 정식 원본 문서 |

권장 추적 흐름은 다음과 같습니다.

```text
이슈 → 스펙/decision → 구현 → 집중 증명
     → 권위 문서 → 아키텍처 증거 → 리뷰 → 종료
```

## 2. 변경 분류

구현 전에 모든 의미 있는 이슈에 1차 변경 분류를 지정합니다.

| 분류 | 필요한 계약 | 대표 증거 |
| --- | --- | --- |
| 공개 API | export type/API 동작과 호환성 규칙 | 패키지 테스트, API 문서, migration note |
| 동작 또는 패턴 | 사용자에게 보이는 state, action, tool, workflow 동작 | 집중 테스트, 실행 예제, 가이드 |
| 아키텍처 | 소유권, 경계, provider 순서, persistence, schema 결정 | decision record, architecture check, 대표 테스트 |
| 버그 | 재현 가능한 실패와 기대 동작 | regression test, 재현 단계, 수정 |
| 문서/유지보수 | 명령, 소유권, 링크, 번역, 생성물 수정 | docs build, link/source check |

이슈 하나에 구현·문서 sub-issue를 연결할 수 있지만, 1차 결과와 책임 owner는
하나로 유지합니다.

## 3. 이슈 생명주기

다음 상태를 사용합니다. 오른쪽 증거가 없으면 코드가 존재한다는 이유만으로
상태를 올리지 않습니다.

| 상태 | 의미 | 종료 증거 |
| --- | --- | --- |
| `proposed` | 사용자 문제나 유지보수 필요가 기록됨 | owner와 결과가 명확함 |
| `specified` | 계약과 acceptance criteria가 합의됨 | 연결된 spec/decision, 제외 범위, 위험 |
| `ready` | 누락된 설계 결정 없이 시작 가능 | 의존성과 검증 계획이 확인됨 |
| `in-progress` | 구현 또는 조사가 진행 중 | 현재 owner와 branch/PR 링크 |
| `blocked` | 외부 결정이나 변경이 필요함 | blocker, 결정 owner, 다음 검토 시점 |
| `review` | 코드·테스트·문서가 리뷰 가능함 | 증거 목록과 변경 범위 |
| `verified` | gate와 acceptance criteria를 통과함 | 명령 결과와 필요 시 수동 증명 |
| `done` | 배포되었거나 의도적으로 반영됨 | 최종 링크, 후속 이슈, migration 상태 |
| `superseded` | 다른 이슈/스펙으로 대체됨 | 대체 링크와 이유 |

`blocked`를 보관 상태로 사용하지 않습니다. 같은 blocker가 지속되면 필요한
결정을 기록하거나 독립적으로 배포 가능한 단위로 분리합니다.

## 4. 필수 이슈 필드

기능·아키텍처·유지보수 이슈는 다음 내용을 포함합니다.

```text
ID / 제목:
변경 분류:
영역 및 owner:
사용자 또는 유지보수 결과:
범위:
제외 범위:
스펙 또는 decision 링크:
Acceptance criteria:
Invariant 및 호환성 제약:
구현 anchor:
테스트/증거 계획:
문서 및 번역 영향:
의존성·위험·migration:
```

버그 이슈는 결과 대신 다음 최소 재현 정보를 사용합니다.

```text
환경 및 revision:
재현 단계:
실제 결과:
기대 결과:
회귀 범위(알 수 있는 경우):
증거(로그, 스크린샷, 실패 테스트):
```

저장소는 `.github/ISSUE_TEMPLATE/` 아래에 진입점별 issue form을 제공합니다.
form은 최소 메타데이터를 수집하며, 지속되는 계약을 도입하는 변경의 정식
스펙은 tracked document에 둡니다.

## 5. 스펙 관리

### 안정적인 identity

지속되는 capability나 계약에는 `CA-WEB-001` 또는 기존 architecture
capability ID 같은 안정적인 ID를 부여합니다. 변하기 쉬운 파일 경로를 ID에
넣지 않습니다. 이름만 바뀌면 ID를 유지하고, 분리·병합·대체는 decision
record로 연결합니다.

### 계약 내용

스펙은 다음을 명시해야 준비 상태입니다.

- 소유 state와 경계;
- input, output, transition, failure behavior;
- invariant와 범위;
- persistence, privacy, security 가정;
- 호환성과 migration 동작;
- 주관적 표현 없이 검증할 수 있는 acceptance criteria;
- 구현·테스트·문서 anchor.

브라우저 persistence라면 database 이름, table/index 변경, schema version,
upgrade 동작, fallback, 기존 데이터 보존 또는 의도적 삭제 증거를 기록합니다.
패널 레이아웃 migration이 기준 사례입니다. Dexie DB version은 1에서 2로
올렸고 `preferences`를 추가했으며, preference schema는 별도로 versioned
상태를 유지합니다.

### Decision record

다음 경계에 영향을 주는 변경은 짧은 decision record를 만듭니다.

- 공개 package API 또는 workspace package 소유권;
- Context-Action provider/handler/store 경계;
- MCP/function-calling protocol 또는 tool result 계약;
- persistence schema, migration, privacy, credential 처리;
- compatibility 예외 또는 임시 convention waiver.

decision에는 context, 검토한 선택지, 결정, 결과, 되돌림 조건, owner,
연결된 issue/capability를 기록합니다. 미래 작업을 제한하는 선택이라면 단순
문장 수정만으로는 부족합니다.

## 6. 개발 및 commit 컨벤션

다음 개발 루프를 따릅니다.

1. 이슈를 열거나 갱신합니다.
2. 가장 작은 지속 가능한 스펙 또는 decision을 작성합니다.
3. 계약을 만족하는 가장 좁은 경계를 구현합니다.
4. 광범위한 정리 전에 집중 증거를 추가합니다.
5. 권위 가이드, README 진입 링크, 번역 페이지를 갱신합니다.
6. 변경 비례 gate를 실행합니다.
7. PR 또는 handoff에 증거를 기록하고 검증 뒤에만 이슈를 닫습니다.

Commit은 주제 단위로 유지합니다. 동작 commit에는 해당 스펙·집중 테스트·권위
문서를 포함할 수 있지만, 무관한 문서 재작성은 별도 commit으로 분리합니다.
기존 Conventional Commit 형식을 사용합니다.

```text
feat: capability 추가
fix: 동작 수정
docs: 권위 가이드 갱신
test: regression gate 추가
refactor: 동작을 유지한 경계 이동
chore: tooling 또는 생성물 유지보수
```

GitHub issue를 사용한다면 commit 또는 PR 본문에 `Refs #<number>` 또는
`Closes #<number>`를 넣습니다. commit hash만으로 이슈를 연결하지 않습니다.

## 7. 문서 관리

- 공개 영문·국문 페이지는 pair source이며 의미와 현재 동작을 맞춥니다.
- 권위 가이드가 설명을 소유합니다. README는 발견과 연결을 담당하며 별도
  계약을 만들지 않습니다.
- API 페이지와 LLMS 산출물은 생성/파생물입니다. 원본을 먼저 수정하고
  generator를 실행합니다.
- 사용할 수 없거나 best-effort, experimental, 수동 credential 의존 기능은
  문서에 그 상태를 표시합니다.
- 새 컨벤션은 Convention Index와 VitePress sidebar에 discovery link를 추가합니다.

최소 집중 gate:

```bash
pnpm docs:build
pnpm docs:management
pnpm convention:check
pnpm docs:full             # 광범위한 API/문서 릴리스
pnpm llms:sync-docs --changed-files <paths>
```

standalone Web Studio는 [Tool-Calling Web Studio 컨벤션](./usecase-tool-calling-web-studio)에
기록된 집중 convention, type-check, build, browser 검증도 실행합니다.

## 8. 현재 피드백과 다음 액션

최근 Dexie panel-layout 변경은 typed contract, repository port, schema
migration, 집중 browser 증거, 영문·국문 문서를 갖추어 상태가 좋습니다.
standalone Web Studio도 이제 `web-coding-demo` architecture analysis project와
`CA-WEB-CODING-STUDIO` capability로 등록되었으며, 현재 상태는
`verified`입니다. standalone 전체 검증, browser migration 증거,
documentation-management gate, architecture SEM gate가 모두 통과했습니다.
추적성을 위해 다음 관리 항목을 기록합니다.

| 상태 | 항목 | 증거 또는 다음 액션 |
| --- | --- | --- |
| 종료 | 이슈 template과 lifecycle이 이전에는 암묵적이었음 | `.github/ISSUE_TEMPLATE/*`를 `pnpm docs:management`가 검사 |
| 종료 | `CA-WEB-CODING-STUDIO` 증거가 아직 승격되지 않았음 | `pnpm web-coding:verify`와 `pnpm arch:check` 통과, registry 상태는 `verified` |
| 종료 | Dexie migration에 명시적인 v1→v2 browser fixture가 없었음 | `scripts/verify-web-coding-browser.mjs`가 v1 DB를 만들고 upgrade를 검증 |
| 종료 | 영문·국문 parity와 내부 링크 유효성이 주로 review convention이었음 | `pnpm docs:management`가 pair page, discovery link, handoff metadata를 검사 |
| P2 | issue→spec→test 연결이 기계적으로 강제되지 않음 | `CA-GOV-TRACE-001`로 추적하며 과거 commit을 다시 쓰지 않고 report 또는 PR check 추가 |

남은 추적성 항목은 현재 기능을 막는 이유가 아니라 프로세스 개선 항목입니다.
이슈 ID가 스펙·커밋·증거에 일관되게 사용될 때까지 governance backlog로 유지합니다.

## 리뷰 및 handoff 체크리스트

- [ ] 이슈 분류, owner, 범위, 제외 범위가 명시됨
- [ ] 지속되는 동작에 tracked spec 또는 decision이 있음
- [ ] Acceptance criteria가 구현·테스트 증거에 연결됨
- [ ] persistence/API/schema 변경에 호환성과 migration note가 있음
- [ ] 권위 영문·국문 문서와 discovery link가 갱신됨
- [ ] 해당 시 원본에서 생성물을 다시 생성함
- [ ] 집중 gate와 수동 증거가 기록됨
- [ ] 미룬 작업이 조용한 TODO가 아닌 후속 이슈로 남아 있음
