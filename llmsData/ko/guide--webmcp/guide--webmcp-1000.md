---
document_id: guide--webmcp
category: guide
source_path: ko/guide/webmcp.md
character_limit: 1000
last_update: '2026-08-08T10:19:46.829Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
WebMCP 브라우저 도구

WebMCP 브라우저 도구 @context-action/webmcp는 Chrome의 실험적 WebMCP imperative API를 통해 canonical Context-Action 도구 레지스트리의 명시적인 일부만 브라우저에 노출합니다. 별도의 레지스트리를 만들지 않으므로 검증, 인가, 승인, idempotency, provenance, durable 실행은 계속 ToolManagementInterface를 경유합니다. > WebMCP는 실험적 브라우저 기능입니다. 지원하지 않는 클라이언트에서도 > 동작할 UI 또는 서버 경로를 유지하고, 점진적 향상 기능으로 사용하세요. capability scope 등록 안정적인 세션 식별자를 지정하고 페이지가 노출할 모든 도구 이름을 명시합니다. 목록에 없는 도구가 암묵적으로 공개되지는 않습니다. 등록된

Key points:
• `exposedTo`에 정확한 소비자 origin을 등록합니다(HTTPS만 허용하며, 로컬
• iframe을 사용한다면 embedding iframe에 `allow="tools"` 권한을 설정합니다.
• 소비자가 일치하는 `fromOrigins` 요청으로 도구를 검색하게 합니다.