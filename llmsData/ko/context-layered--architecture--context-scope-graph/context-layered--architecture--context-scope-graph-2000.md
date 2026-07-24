---
document_id: context-layered--architecture--context-scope-graph
category: context-layered
source_path: ko/context-layered/architecture/context-scope-graph.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.466Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
ContextScope 심볼 그래프

ContextScope 심볼 그래프 상태와 목적 이 문서는 의미 있는 컨텍스트 단위로 심볼을 묶는 계약이다. 현재 PoC에는 revision-bound manifest parser, context-scope CLI projection, JSON Schema, library 수준 bounded SEM dependency projection이 구현되어 있다. renderer와 API/transaction 전용 adapter는 후속 작업이다. 첫 번째 제공 범위는 화면이다. 화면을 진입 심볼로 보고 정적으로 사용되는 하위 심볼을 하나의 큰 시각적 경계 안에 표시한다. 영속적인 모델은 API 경계, 트랜잭션, workflow, 문서도 지원하도록 설계하지만, 첫 release가 이 adapter들을 이미 제공한다는 뜻은 아니다. 따라서 영속적인 추상화는 ScreenGraph가 아니라 ContextScope로 둔다. 입력 계층 그래프는 기존 증거 계층 위에 파생된다. 완전한 심볼 snapshot은 특정 revision의 정의 목록에 대한 canonical inventory다. ContextScope 그래프는 여기에 멤버십과 관계를 추가하는 파생 뷰이며, 별도의 심볼 ID 체계를 만들거나 snapshot을 부분 탐색 결과로 대체하지 않는다. 핵심 계약 SymbolRef는 기존 canonical 심볼 ID인 projectId, filePath, entityId 조합을 사용한다. SymbolKey는 이 조합의 JSON-safe 결정적 직렬화이며, 새로 작성하는 identity가 아니다. 따라서 anchor, node, edge, group member는 모두 정확히 같은 심볼 identity를 해석해야 한다. 그룹은 심볼이 아니라 화면에 표시되는 경계다. 그룹 멤버십은 겹칠 수 있으므로 공유 심볼은 canonical node를 복제하지 않고 여러 그룹에서 참조한다. Context profile 각 context 종류는 허용되는

Key points:
• context profile을 검증하고 완전한 snapshot에서 모든 manifest anchor를 해석한다.
• manifest가 snapshot과 같은 선택 revision에 속하는지 검증한다.
• profile이 허용하는 SEM dependency 증거와 manifest 선언 edge를 읽는다.
• breadth-first 확장 전에 후보 edge를 `from`, `to`, `kind`, evidence reference 순으로 정렬한다.
• 허용 edge 종류를 설정된 깊이까지 탐색하고 canonical 심볼 identity로 중복 제거한다.
• context, architectural layer, project, module 멤버십을 만들고 모든 collection을 결정적으로 정렬한다.
• Foundation에 versioned `SymbolRef`와 파생 `SymbolKey`를 추가하고, architecture-governance에서
• `architecture/` 아래 repository-local context manifest를 추가하고 완전한 anchor identity, profile
• screen adapter만 구현한다. **manifest...