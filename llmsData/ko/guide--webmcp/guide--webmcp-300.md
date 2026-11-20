---
document_id: guide--webmcp
category: guide
source_path: ko/guide/webmcp.md
character_limit: 300
last_update: '2026-11-20T08:50:10.825Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
WebMCP 브라우저 도구

WebMCP 브라우저 도구 @context-action/webmcp는 Chrome의 실험적 WebMCP imperative API를 통해 canonical Context-Action 도구 레지스트리의 명시적인 일부만 브라우저에 노출합니다. 별도의 레지스트리를 만들지 않

Key points:
• `exposedTo`에 정확한 소비자 origin을 등록합니다(HTTPS만 허용하며, 로컬
• iframe을 사용한다면 embedding iframe에 `allow="tools"` 권한을 설정합니다.