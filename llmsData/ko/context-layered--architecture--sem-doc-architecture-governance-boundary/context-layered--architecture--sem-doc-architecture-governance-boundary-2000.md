---
document_id: context-layered--architecture--sem-doc-architecture-governance-boundary
category: context-layered
source_path: ko/context-layered/architecture/sem-doc-architecture-governance-boundary.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.963Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc과 Architecture Governance의 경계

sem-doc과 Architecture Governance의 경계 @context-action/sem-doc과 @context-action/architecture-governance는 서로 관련된 저장소 도구지만, 같은 라이브러리의 다른 이름이 아니며 서로를 대체하지도 않습니다. 두 도구는 같은 외부 sem 실행 파일과 정책 중립적인 Foundation 패키지를 사용할 수 있지만, 입력·출력·사용자·실패 의미와 release 계약은 독립적으로 유지합니다. 포지션은 의도적으로 비대칭입니다. sem-doc은 운영용 심볼 컨텍스트 plane이고, Architecture Governance는 Context-Action convention을 실험하는 규칙형 control plane입니다. 후자는 repository-local authored rule과 evidence 관리 방식을 시험하는 도구이지, 범용 architecture 표준이나 문서 편집기가 아닙니다. 한눈에 보는 결정 | 패키지 | 기본 질문 | 주요 입력 | 주요 출력 | 사용자 | gate 여부 | | --- | --- | --- | --- | --- | --- | | @context-action/sem-doc | 이 코드를 바꾸기 전에 어떤 컨텍스트·문서·운영 scope를 알아야 하는가? | target entity/path, TSDoc binding, Git working-tree/staged 상태 | sem-doc-work-context.v5, canonical sem-doc-context-scope.v3, sem-documents.v3, sem-doc-git-diff.v1, binding·benchmark report | 구현자, reviewer, agent | advisory context; architecture gate 아님 | | @context-action/architecture-governanc

Key points:
• target entity와 정의 source를 찾기
• bounded 1-hop/2-hop 구조 관계 수집
• dependent file과 affected test를 advisory evidence로 나열
• 정확한 TSDoc entity binding과 backlink 색인
• 편집 전 Git working-tree/staged diff 기록
• 작업 컨텍스트를 화면·API·transaction review용 canonical operational `sem-doc-context-scope.v3` grouping으로 투영
• bounded commit snapshot/diff를 materialize하고 NDJSON으로 stream하며 두 branch의 변경 symbol 교집합을 추출
• 안정적인 `CA-*` capability와 `SymbolRef` implementation anchor 유지
• owner, role, test, public-doc, package/impact evidence 검증
• revision별 complete symbol snapshot materialize
• partial...