---
document_id: context-layered--architecture--context-scope-graph
category: context-layered
source_path: ko/context-layered/architecture/context-scope-graph.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.466Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
ContextScope 심볼 그래프

ContextScope 심볼 그래프 상태와 목적 이 문서는 의미 있는 컨텍스트 단위로 심볼을 묶는 계약이다. 현재 PoC에는 revision-bound manifest parser, context-scope CLI projection, JSON Schema, library 수준 bounded SEM dependency projection이 구현되어 있다. renderer와 API/transaction 전용 adapter는 후속 작업이다. 첫 번째 제공 범위는 화면이다. 화면을 진입 심볼로 보고 정적으로 사용되는 하위 심볼을 하나의 큰 시각적 경계 안에 표시한다. 영속적인 모델은 API 경계, 트랜잭션, workflow, 문서도 지원하도록 설계하지만, 첫 release가 이 adapter들을 이미 제공한다는 뜻은 아니다. 따라서 영속적인 추상화는 ScreenGraph가 아니라 ContextScope로 둔다. 입력 계층 그래프는 기존 증거 계층 위에 파생된다. 완전한 심볼 snapshot은 특정 revision의 정의 목록에 대한 canonical inventory다. ContextScope 그래프는 여기에 멤버십과 관계를 추가하는 파생 뷰이며, 별도의 심볼 ID 체계를 만들거나 snapshot을 부분 탐색 결과로 대체하지 않는다. 핵심 계약 SymbolRef는 기존 canonical 심볼 ID인 projectId, filePath, entityId 조합을 사용한다. SymbolKey는 이 조합의 JSON-safe 결정적 직렬화이며, 새로 작성하는 identity가 아니다. 따라서 anchor, node, edge, group member는 모두 정확히 같은 심볼 identity를 해석해야 한다. 그룹은 심볼이 아니라 화면에 표시되는 경계다. 그룹 멤버십은 겹칠 수 있으므로 공유 심볼은 canonical node를 복제하지 않고 여러 그룹에서 참조한다. Context profile 각 context 종류는 허용되는 anchor 역할과 관계 vocabulary를 profile로 정의한다. | Profile | 허용 anchor role | 초기 제공 범위 | 주요 관계 경로 | | --- | --- | --- | --- | | screen | root, view, state-read, state-write | 첫 adapter | component → rendered symbol → state read → child view | | api | endpoint, controller | 이후 adapter | endpoint → controller → service → repository/schema | | transaction | trigger, state-read, state-write, view | 이후 adapter | action → handler/business → state write → selector → affected view | | workflow | command, step | v1 미지원 | command → step → external effect → next step | | document | definition, reference | v1 미지원 | document definition → referenced symbol → implementation/test | Context-Action mapping manifest는 generic scope model과 Context-Action runtime 계층을 연결하는 bridge입니다. snapshot의 동일한 SymbolRef를 재사용하고 graph role만 부여하므로 심볼 identity를 바꾸지 않습니다. | Context-Action 계층 | ContextScope profile/role | 증거 경계 | | --- | --- | --- | | View/Page | screen.root, view | manifest anchor; SEM 구조적 dependent | | Action dispatch | transaction.trigger, command | manifest anchor와 선언 edge | | Handler / business | transaction.controller, step | manifest anchor와 선언 edge | | Store read/write | state-read, state-write | manifest 선언; 추후 provider별 증거 | | Hook / selector | state-read 또는 영향받는 view | manifest 선언 | 초기 screen adapter 다음에는 Context-Action과 직접 연결되는 첫 확장으로 action → handler/business → store write → selector 또는 hook → affected view를 표현하는 transaction profile을 우선합니다. screen profile은 읽기 중심의 view 경계를 보완합니다. 이 mapping은 작성된 의도이며, SEM이 구조적 depends-on만으로 renders, reads, writes 의미를 증명한다는 뜻은 아닙니다. 첫 adapter에서 SEM은 depends-on edge만 생성한다. renders, reads, writes 같은 의미론적 edge는 manifest가 stable declaration ID와 함께 선언하거나, 추후 versioned provider가 증거를 제공할 때만 허용한다. v1 계약에는 inferred evidence source가 없다. 일반적인 depends-on은 구조적 증거로 사용할 수

Key points:
• context profile을 검증하고 완전한 snapshot에서 모든 manifest anchor를 해석한다.
• manifest가 snapshot과 같은 선택 revision에 속하는지 검증한다.
• profile이 허용하는 SEM dependency 증거와 manifest 선언 edge를 읽는다.
• breadth-first 확장 전에 후보 edge를 `from`, `to`, `kind`, evidence reference 순으로 정렬한다.
• 허용 edge 종류를 설정된 깊이까지 탐색하고 canonical 심볼 identity로 중복 제거한다.
• context, architectural layer, project, module 멤버십을 만들고 모든 collection을 결정적으로 정렬한다.
• Foundation에 versioned `SymbolRef`와 파생 `SymbolKey`를 추가하고, architecture-governance에서
• `architecture/` 아래 repository-local context manifest를 추가하고 완전한 anchor identity, profile
• screen adapter만 구현한다. **manifest projection은 CLI에서, bounded SEM dependency projection은
• renderer 선택 전에 JSON graph CLI와 schema export를 제공한다. **`context-scope`와 deterministic
• provider/manifest 증거가 edge mapping test를 갖춘 뒤 API와 transaction adapter를 추가한다. workflow와
• 직렬화 계약이 안정된 뒤 compound graph UI와 상호작용 증거를 추가하고 canonical node set으로 group