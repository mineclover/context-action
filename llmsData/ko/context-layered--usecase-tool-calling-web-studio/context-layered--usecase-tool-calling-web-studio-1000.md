---
document_id: context-layered--usecase-tool-calling-web-studio
category: context-layered
source_path: ko/context-layered/usecase-tool-calling-web-studio.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.484Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Web Studio 컨벤션

Tool Calling Web Studio 컨벤션 이 문서는 standalone web-coding 데모에서 검증한 구조를 재사용 가능한 Context-Action 컨벤션과 use case recipe로 정리합니다. 모델/provider, typed tool registry, workspace 도메인 로직, 브라우저 persistence, React view 사이의 경계를 고정하는 것이 목적입니다. 모든 Context-Action 애플리케이션이 MCP나 iframe preview를 사용해야 한다는 뜻은 아니며, tool-calling web studio 형태에 적용하는 데모 컨벤션입니다. 이 recipe를 사용하는 경우 다음 요구가 하나 이상 있을 때 사용합니다

Key points:
• model 또는 local agent가 document-like workspace를 읽고 변경해야 할 때
• MCP/function-calling tool을 list, approval, execute, structured result로
• IndexedDB, Blob asset, local folder adapter 같은 browser...