# ContextScope 심볼 그래프

## 상태와 목적

이 문서는 의미 있는 컨텍스트 단위로 심볼을 묶는 계약이다. 현재 PoC에는 revision-bound manifest
parser, `context-scope` CLI projection, JSON Schema, library 수준 bounded SEM dependency projection이
구현되어 있다. renderer와 API/transaction 전용 adapter는 후속 작업이다.

첫 번째 제공 범위는 화면이다. 화면을 진입 심볼로 보고 정적으로 사용되는 하위 심볼을 하나의 큰
시각적 경계 안에 표시한다. 영속적인 모델은 API 경계, 트랜잭션, workflow, 문서도 지원하도록
설계하지만, 첫 release가 이 adapter들을 이미 제공한다는 뜻은 아니다. 따라서 영속적인 추상화는
`ScreenGraph`가 아니라 `ContextScope`로 둔다.

## 입력 계층

그래프는 기존 증거 계층 위에 파생된다.

```text
완전한 심볼 snapshot + context manifest + SEM 증거
                         ↓
                 ContextScope 그래프 JSON
                         ↓
                 compound graph renderer
```

완전한 심볼 snapshot은 특정 revision의 정의 목록에 대한 canonical inventory다. ContextScope
그래프는 여기에 멤버십과 관계를 추가하는 파생 뷰이며, 별도의 심볼 ID 체계를 만들거나 snapshot을
부분 탐색 결과로 대체하지 않는다.

## 핵심 계약

```ts
interface SymbolRef {
  projectId: string;
  filePath: string;
  entityId: string;
}

/** Foundation의 JSON-safe symbolRefKey(SymbolRef)로 파생하며, 별도로 작성하는 ID가 아니다. */
type SymbolKey = string;

interface ContextScope {
  contractId: 'context-action/context-scope';
  contractVersion: '1.0';
  context: {
    id: string;
    kind: 'screen' | 'api' | 'transaction' | 'workflow' | 'document';
    label?: string;
  };
  source: {
    snapshot: {
      contractId: 'context-action/symbol-snapshot';
      contractVersion: '1.1';
      revision: SymbolSnapshotRevision;
    };
    manifest: {
      path: string;
      contentDigest: string;
    };
  };
  anchors: ContextAnchor[];
  nodes: SymbolRef[];
  edges: ContextEdge[];
  groups: SymbolGroup[];
  status: ContextScopeStatus;
}

interface ContextAnchor {
  role: ContextAnchorRole;
  symbol: SymbolRef;
}

type ContextAnchorRole =
  | 'root'
  | 'view'
  | 'endpoint'
  | 'controller'
  | 'trigger'
  | 'state-read'
  | 'state-write'
  | 'command'
  | 'step'
  | 'definition'
  | 'reference';

type ContextEdgeKind =
  | 'depends-on'
  | 'invokes'
  | 'reads'
  | 'writes'
  | 'renders'
  | 'validates'
  | 'documents';

interface ContextEdge {
  /** `kind`가 정한 의미로 `from`이 `to`에 의존·호출·렌더링·읽기·쓰기를 수행한다. */
  from: SymbolKey;
  to: SymbolKey;
  kind: ContextEdgeKind;
  evidence:
    | { provider: 'sem'; relation: 'dependency' | 'dependent' }
    | { provider: 'manifest'; declarationId: string };
}

interface SymbolGroup {
  id: string;
  kind: 'context' | 'layer' | 'module' | 'project';
  label: string;
  memberNodeKeys: SymbolKey[];
}

type ContextScopeStatus =
  | { kind: 'complete'; appliedLimits: AppliedContextGraphLimits }
  | {
      kind: 'incomplete';
      appliedLimits: AppliedContextGraphLimits;
      reasons: ContextScopeIncompleteReason[];
    }
  | { kind: 'invalid'; errors: ContextScopeValidationError[] };

interface AppliedContextGraphLimits {
  maxDepth: number;
  maxNodes: number;
  maxEdges: number;
  maxGroups: number;
}

type ContextScopeIncompleteReason =
  | 'depth'
  | 'nodes'
  | 'edges'
  | 'groups'
  | 'budget'
  | 'evidence-unavailable';

type ContextScopeValidationError =
  | 'anchor-unresolved'
  | 'manifest-revision-mismatch'
  | 'unsupported-profile';

interface ContextManifest {
  schemaVersion: 1;
  contexts: ContextManifestEntry[];
}

interface ContextManifestEntry {
  id: string;
  kind: ContextScope['context']['kind'];
  label?: string;
  anchors: ContextAnchor[];
  declaredEdges?: DeclaredContextEdge[];
}

interface DeclaredContextEdge {
  id: string;
  from: SymbolRef;
  to: SymbolRef;
  kind: ContextEdgeKind;
}
```

`SymbolRef`는 기존 canonical 심볼 ID인 `projectId`, `filePath`, `entityId` 조합을 사용한다.
`SymbolKey`는 이 조합의 JSON-safe 결정적 직렬화이며, 새로 작성하는 identity가 아니다. 따라서
anchor, node, edge, group member는 모두 정확히 같은 심볼 identity를 해석해야 한다. 그룹은 심볼이
아니라 화면에 표시되는 경계다. 그룹 멤버십은 겹칠 수 있으므로 공유 심볼은 canonical node를
복제하지 않고 여러 그룹에서 참조한다.

## Context profile

각 context 종류는 허용되는 anchor 역할과 관계 vocabulary를 profile로 정의한다.

| Profile | 허용 anchor role | 초기 제공 범위 | 주요 관계 경로 |
| --- | --- | --- | --- |
| `screen` | `root`, `view`, `state-read`, `state-write` | 첫 adapter | component → rendered symbol → state read → child view |
| `api` | `endpoint`, `controller` | 이후 adapter | endpoint → controller → service → repository/schema |
| `transaction` | `trigger`, `state-read`, `state-write`, `view` | 이후 adapter | action → handler/business → state write → selector → affected view |
| `workflow` | `command`, `step` | v1 미지원 | command → step → external effect → next step |
| `document` | `definition`, `reference` | v1 미지원 | document definition → referenced symbol → implementation/test |

## Context-Action mapping

manifest는 generic scope model과 Context-Action runtime 계층을 연결하는 bridge입니다. snapshot의
동일한 `SymbolRef`를 재사용하고 graph role만 부여하므로 심볼 identity를 바꾸지 않습니다.

| Context-Action 계층 | ContextScope profile/role | 증거 경계 |
| --- | --- | --- |
| View/Page | `screen.root`, `view` | manifest anchor; SEM 구조적 dependent |
| Action dispatch | `transaction.trigger`, `command` | manifest anchor와 선언 edge |
| Handler / business | `transaction.controller`, `step` | manifest anchor와 선언 edge |
| Store read/write | `state-read`, `state-write` | manifest 선언; 추후 provider별 증거 |
| Hook / selector | `state-read` 또는 영향받는 `view` | manifest 선언 |

초기 screen adapter 다음에는 Context-Action과 직접 연결되는 첫 확장으로
`action → handler/business → store write → selector 또는 hook → affected view`를 표현하는
transaction profile을 우선합니다. screen profile은 읽기 중심의 view 경계를 보완합니다. 이 mapping은
작성된 의도이며, SEM이 구조적 `depends-on`만으로 `renders`, `reads`, `writes` 의미를 증명한다는
뜻은 아닙니다.

첫 adapter에서 SEM은 `depends-on` edge만 생성한다. `renders`, `reads`, `writes` 같은 의미론적 edge는
manifest가 stable declaration ID와 함께 선언하거나, 추후 versioned provider가 증거를 제공할 때만
허용한다. v1 계약에는 `inferred` evidence source가 없다. 일반적인 `depends-on`은 구조적 증거로
사용할 수 있지만 runtime 호출이나 시간 순서로 표현해서는 안 된다.

트랜잭션의 `writes`와 `reads`는 상태 역할을 나타낼 뿐 실행 순서를 증명하지 않는다. 첫 screen-only
adapter는 내부 호출 횟수나 완전한 runtime graph를 추론하지 않는다. transaction 증거는 필요한 경우
추후 LSP 또는 runtime provider로 추가한다.

## Context manifest

route나 action 이름이 심볼로 오인되지 않도록 context를 명시적으로 선언한다. manifest는 `filePath`를
포함하는 완전한 snapshot identity를 사용하며 `SymbolKey`를 직접 작성하지 않는다. 선언 edge는 의도를
설명하고 SEM 증거와 구별된다. manifest 안에서 context ID와 declared-edge ID는 각각 유일해야 한다.

```json
{
  "schemaVersion": 1,
  "revision": { "gitHead": "<snapshot gitHead>" },
  "contexts": [
    {
      "id": "dashboard",
      "kind": "screen",
      "label": "Dashboard",
      "anchors": [
        {
          "role": "root",
          "symbol": {
            "projectId": "example",
            "filePath": "example/src/Dashboard.tsx",
            "entityId": "example/src/Dashboard.tsx::function::Dashboard"
          }
        }
      ],
      "declaredEdges": [
        {
          "id": "dashboard-renders-profile-card",
          "from": {
            "projectId": "example",
            "filePath": "example/src/Dashboard.tsx",
            "entityId": "example/src/Dashboard.tsx::function::Dashboard"
          },
          "to": {
            "projectId": "example",
            "filePath": "example/src/ProfileCard.tsx",
            "entityId": "example/src/ProfileCard.tsx::function::ProfileCard"
          },
          "kind": "renders"
        }
      ]
    },
    {
      "id": "update-profile",
      "kind": "transaction",
      "anchors": [
        {
          "role": "trigger",
          "symbol": {
            "projectId": "example",
            "filePath": "example/src/actions.ts",
            "entityId": "example/src/actions.ts::function::updateProfile"
          }
        }
      ]
    }
  ]
}
```

manifest는 의도이고 SEM 결과 및 기타 provider는 증거다. 선택한 revision에서 anchor를 찾지 못하거나
지원하지 않는 profile 또는 다른 revision의 manifest를 사용하면 결과는 `invalid`다. 같은 이름의 다른
project/file 심볼로 대체해서는 안 된다. historical graph는 snapshot과 같은 commit에서 manifest를
읽고, working-tree graph는 manifest content digest를 출력에 기록한다. 따라서 다른 snapshot revision에
manifest를 조용히 재사용할 수 없다.

## 파생과 완전성

첫 파생 알고리즘은 선언된 anchor에서 시작하는 bounded breadth-first traversal이다.

1. context profile을 검증하고 완전한 snapshot에서 모든 manifest anchor를 해석한다.
2. manifest가 snapshot과 같은 선택 revision에 속하는지 검증한다.
3. profile이 허용하는 SEM dependency 증거와 manifest 선언 edge를 읽는다.
4. breadth-first 확장 전에 후보 edge를 `from`, `to`, `kind`, evidence reference 순으로 정렬한다.
5. 허용 edge 종류를 설정된 깊이까지 탐색하고 canonical 심볼 identity로 중복 제거한다.
6. context, architectural layer, project, module 멤버십을 만들고 모든 collection을 결정적으로 정렬한다.

```ts
interface ContextGraphOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxEdges?: number;
  maxGroups?: number;
  onLimit?: 'error' | 'incomplete';
}
```

원본 snapshot은 완전한 상태로 유지하면서 파생 그래프만 제한할 수 있다. serializer는 해석된
`maxDepth`를 포함한 적용 numeric limit을 기록한다. 허용 edge가 그 깊이 너머에 남거나 node, edge,
group, 실행 budget에 도달하면 모든 원인과 함께 `incomplete`로 기록한다. 탐색에 필요한 증거가 없을
때도 `incomplete`이며, 잘못된 입력이나 revision 불일치는 `invalid`다. complete 뷰가 필요한 호출자는
fail-closed해야 한다. 잘린 그래프를 complete로 표시해서는 안 된다.

## Bubble과 renderer 의미

renderer는 compound graph layout을 사용한다.

```text
Context bubble
 ├─ UI / API / Action layer bubble
 ├─ project 또는 module bubble
 └─ symbol nodes
```

핵심 그래프의 group은 `memberNodeKeys`를 갖는 겹칠 수 있는 멤버십이며 의도적으로 parent pointer를
갖지 않는다. renderer가 중첩 bubble을 만들 때는 호환되는 멤버십 projection 하나를 선택한다. 이
projection은 forest여야 한다. 즉 group ID는 유일하고, 모든 member key는 `nodes`에 존재하며, child
멤버십은 parent 멤버십의 부분집합이고 cycle은 invalid다. renderer는 겹치는 layer/module/context
멤버십을 하나의 tree로 강제해서는 안 된다. 공유 service, store, schema가 context를 가로지르는
관계라는 사실을 볼 수 있도록 group 경계를 넘는 edge도 유지한다. group을 선택하면 멤버가 강조되고,
공유 node를 선택하면 해당 심볼을 포함한 모든 context가 표시된다.

layout 좌표, 색상, hierarchy projection, 접힘 상태는 renderer 또는 presentation artifact의 책임이며
canonical symbol snapshot에 저장하지 않는다.

## Architecture Governance 범위와의 관계

현재 Architecture Governance의 범위는 authored capability identity, 심볼 identity, 정의 위치,
역할 evidence, usage files, revision history다. `ContextScope`는 이 catalog 위에 만들어지는 파생
뷰다. 경량 LSP 경계를 바꾸지 않으며 business correctness, runtime behavior, 호출 횟수를 증명하지
않는다. 문서 checkpoint, TSDoc backlink, working-tree context는 별도 패키지인
`@context-action/sem-doc`의 책임이다.

## 구현 순서

1. Foundation에 versioned `SymbolRef`와 파생 `SymbolKey`를 추가하고, architecture-governance에서
   `ContextScope`, manifest, status 계약과 JSON schema, deterministic normalizer를 노출한다. **PoC에
   구현됨.**
2. `architecture/` 아래 repository-local context manifest를 추가하고 완전한 anchor identity, profile
   role, 선언 edge ID, 같은 revision에서의 loading을 검증한다. **loader/CLI 입력 계약으로 구현되었고
   checked-in `contexts.json`은 선택 사항이다.**
3. screen adapter만 구현한다. **manifest projection은 CLI에서, bounded SEM dependency projection은
   library API에서 제공한다.**
4. renderer 선택 전에 JSON graph CLI와 schema export를 제공한다. **`context-scope`와 deterministic
   sorting으로 구현되었으며 renderer 선택은 후속 작업이다.**
5. provider/manifest 증거가 edge mapping test를 갖춘 뒤 API와 transaction adapter를 추가한다. workflow와
   document profile은 adapter가 생길 때까지 거부한다.
6. 직렬화 계약이 안정된 뒤 compound graph UI와 상호작용 증거를 추가하고 canonical node set으로 group
   교집합과 boundary 비교를 확장한다.

이 순서를 따르면 시각적 client가 없어도 history diff, context intersection, 문서화에 그래프를
재사용할 수 있다.
