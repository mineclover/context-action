# ContextScope 심볼 그래프

## 상태와 목적

이 문서는 의미 있는 컨텍스트 단위로 심볼을 묶는 설계를 정의한다. 다음 Samdocs/
architecture-governance PoC를 위한 설계 계약이며, 그래프 산출물이나 renderer가 이미 구현되었다는
의미는 아니다.

첫 사용 사례는 화면이다. 화면을 진입 심볼로 보고 정적으로 사용되는 하위 심볼을 하나의 큰
시각적 경계 안에 표시한다. 같은 모델은 API 경계, 트랜잭션, workflow, 문서에도 적용되어야 한다.
따라서 영속적인 추상화는 `ScreenGraph`가 아니라 `ContextScope`로 둔다.

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
interface ContextScope {
  schemaVersion: 'context-action/context-scope.v1';
  context: {
    id: string;
    kind: 'screen' | 'api' | 'transaction' | 'workflow' | 'document';
    label?: string;
  };
  revision: SymbolSnapshotRevision;
  anchors: ContextAnchor[];
  nodes: SymbolRef[];
  edges: ContextEdge[];
  groups: SymbolGroup[];
  completeness: {
    complete: boolean;
    maxDepth: number;
    truncated?: 'nodes' | 'edges' | 'groups' | 'budget';
  };
}

interface ContextAnchor {
  role: 'root' | 'endpoint' | 'trigger' | 'state-read' | 'state-write' | 'view';
  symbolId: string;
}

interface ContextEdge {
  from: string;
  to: string;
  kind:
    | 'depends-on'
    | 'invokes'
    | 'reads'
    | 'writes'
    | 'renders'
    | 'validates'
    | 'documents';
  source: 'sem' | 'declared' | 'inferred';
}

interface SymbolGroup {
  id: string;
  kind: 'context' | 'layer' | 'module' | 'project';
  label: string;
  memberNodeIds: string[];
  parentGroupId?: string;
}
```

`SymbolRef`는 기존 canonical 심볼 ID인 `projectId`, `filePath`, `entityId` 조합을 사용한다. 그룹은
심볼이 아니라 화면에 표시되는 경계다. 그룹 멤버십은 겹칠 수 있으므로 공유 심볼은 canonical
node를 복제하지 않고 여러 그룹에서 참조한다.

## Context profile

각 context 종류는 허용되는 anchor 역할과 관계 vocabulary를 profile로 정의한다.

| Profile | 대표 anchor | 주요 관계 경로 |
| --- | --- | --- |
| `screen` | root component, view | component → rendered symbol → state read → child view |
| `api` | endpoint, controller | endpoint → controller → service → repository/schema |
| `transaction` | trigger, state read/write, view | action → handler/business → state write → selector → affected view |
| `workflow` | command, step | command → step → external effect → next step |
| `document` | definition, reference | document definition → referenced symbol → implementation/test |

각 adapter는 provider별 증거를 위 의미론적 edge 종류로 정규화한다. 일반적인 `depends-on`은
구조적 fallback 관계로 사용할 수 있지만 runtime 호출이나 시간 순서로 표현해서는 안 된다.

트랜잭션의 `writes`와 `reads`는 상태 역할을 나타낼 뿐 실행 순서를 증명하지 않는다. 현재 경량
구현은 내부 호출 횟수나 완전한 runtime graph를 추론하지 않는다. 필요한 경우 추후 LSP 또는
runtime provider를 추가한다.

## Context manifest

route나 action 이름이 심볼로 오인되지 않도록 context를 명시적으로 선언한다. manifest는 canonical
snapshot identity를 가리킨다.

```json
{
  "schemaVersion": 1,
  "contexts": [
    {
      "id": "dashboard",
      "kind": "screen",
      "label": "Dashboard",
      "anchors": [
        {
          "role": "root",
          "projectId": "example",
          "entityId": "example/src/Dashboard.tsx::function::Dashboard"
        }
      ]
    },
    {
      "id": "update-profile",
      "kind": "transaction",
      "anchors": [
        {
          "role": "trigger",
          "projectId": "example",
          "entityId": "example/src/actions.ts::function::updateProfile"
        }
      ]
    }
  ]
}
```

manifest는 의도이고 SEM 결과 및 기타 provider는 증거다. 선택한 revision에서 anchor를 찾을 수
없으면 같은 이름의 다른 project/file 심볼로 대체하지 않고 incomplete 또는 invalid로 보고한다.

## 파생과 완전성

첫 파생 알고리즘은 선언된 anchor에서 시작하는 bounded breadth-first traversal이다.

1. 완전한 snapshot에서 각 anchor를 해석한다.
2. SEM 구조 관계와 선언된 role edge를 읽는다.
3. profile에서 허용한 edge 종류를 설정된 깊이까지 탐색한다.
4. canonical 심볼 ID로 중복 제거한다.
5. context, architectural layer, project, module 기준으로 group을 만든다.
6. node, edge, group을 결정적으로 정렬한다.

```ts
interface ContextGraphOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxEdges?: number;
  maxGroups?: number;
  onLimit?: 'error' | 'incomplete';
}
```

원본 snapshot은 완전한 상태로 유지하면서 파생 그래프만 제한할 수 있다. 제한에 도달한 그래프는
`completeness.complete = false`와 원인을 기록하거나, 완전한 뷰를 요구하는 호출자에게 fail-closed
해야 한다. 잘린 그래프를 complete로 표시해서는 안 된다.

## Bubble과 renderer 의미

renderer는 compound graph layout을 사용한다.

```text
Context bubble
 ├─ UI / API / Action layer bubble
 ├─ project 또는 module bubble
 └─ symbol nodes
```

중첩 group은 `memberNodeIds`를 감싸는 시각적 경계다. 공유 service, store, schema가 context를
가로지르는 관계라는 사실을 볼 수 있도록 group 경계를 넘는 edge도 유지한다. group을 선택하면
멤버가 강조되고, 공유 node를 선택하면 해당 심볼을 포함한 모든 context가 표시된다.

layout 좌표, 색상, 접힘 상태는 renderer 또는 presentation artifact의 책임이며 canonical symbol
snapshot에 저장하지 않는다.

## 현재 Samdocs 범위와의 관계

현재 Samdocs의 범위는 심볼 identity, 정의 위치, 역할 문서, usage files, revision history다.
`ContextScope`는 이 catalog 위에 만들어지는 파생 뷰다. 경량 LSP 경계를 바꾸지 않으며 business
correctness, runtime behavior, 호출 횟수를 증명하지 않는다.

## 구현 순서

1. Foundation에 versioned `ContextScope` 계약과 deterministic normalizer를 추가한다.
2. `architecture/` 아래 context manifest를 추가하고 anchor identity를 검증한다.
3. snapshot과 SEM 증거를 사용하는 screen, API, transaction adapter를 구현한다.
4. renderer 선택 전에 JSON graph를 생성하는 CLI를 제공한다.
5. 직렬화 계약이 안정된 뒤 compound graph UI와 상호작용 증거를 추가한다.
6. canonical node set을 사용해 group 교집합과 boundary 비교를 확장한다.

이 순서를 따르면 시각적 client가 없어도 history diff, context intersection, 문서화에 그래프를
재사용할 수 있다.
