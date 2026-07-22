---
document_id: context-layered--architecture--sem-doc-architecture-governance-boundary
category: context-layered
source_path: ko/context-layered/architecture/sem-doc-architecture-governance-boundary.md
character_limit: 1000
last_update: '2026-07-20T17:25:11.395Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc과 Architecture Governance의 경계

sem-doc과 Architecture Governance의 경계 @context-action/sem-doc과 @context-action/architecture-governance는 서로 관련된 저장소 도구지만, 같은 라이브러리의 다른 이름이 아니며 서로를 대체하지도 않습니다. 두 도구는 같은 외부 sem 실행 파일과 정책 중립적인 Foundation 패키지를 사용할 수 있지만, 입력·출력·사용자·실패 의미와 release 계약은 독립적으로 유지합니다. 포지션은 의도적으로 비대칭입니다. sem-doc은 운영용 심볼 컨텍스트 plane이고, Architecture Governance는 Context-Action c

Key points:
• target entity와 정의 source를 찾기
• bounded 1-hop/2-hop 구조 관계 수집
• dependent file과 affected test를 advisory evidence로 나열
• 정확한 TSDoc entity binding과 backlink 색인
• 편집 전 Git...