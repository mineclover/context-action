---
document_id: guide--webmcp
category: guide
source_path: ko/guide/webmcp.md
character_limit: 2000
last_update: '2026-08-08T10:19:46.829Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
WebMCP 브라우저 도구

WebMCP 브라우저 도구 @context-action/webmcp는 Chrome의 실험적 WebMCP imperative API를 통해 canonical Context-Action 도구 레지스트리의 명시적인 일부만 브라우저에 노출합니다. 별도의 레지스트리를 만들지 않으므로 검증, 인가, 승인, idempotency, provenance, durable 실행은 계속 ToolManagementInterface를 경유합니다. > WebMCP는 실험적 브라우저 기능입니다. 지원하지 않는 클라이언트에서도 > 동작할 UI 또는 서버 경로를 유지하고, 점진적 향상 기능으로 사용하세요. capability scope 등록 안정적인 세션 식별자를 지정하고 페이지가 노출할 모든 도구 이름을 명시합니다. 목록에 없는 도구가 암묵적으로 공개되지는 않습니다. 등록된 각 WebMCP 호출에는 도구 호출 ID가 생성되며 registry.executeModelToolCall()을 통해 실행됩니다. adapter는 canonical context에 source: 'model', mode: 'agent', metadata.transport: 'webmcp'를 기록합니다. 기본적으로 호출 ID가 idempotency key가 되며, 워크플로에 안정적인 재시도 키가 있다면 getIdempotencyKey를 제공하세요. 반환된 scope는 현재 문서가 WebMCP를 지원하는지 알려줍니다. SSR 또는 미지원 브라우저에서는 예외 대신 supported: false인 inert scope를 반환하므로, 기능 감지는 UI 경계에서 처리할 수 있습니다. React 수명 주기 통합 @context-action/react/tools는 컴포넌트 수명 주기에 맞춰 등록을 관리하는 훅을 제공합니다. ToolContext에서 canonical registry를 얻고, 관련 없는 렌더링에서 도구가 재등록되지 않도록 options 객체를 메모이즈하세요. 이 훅은 언마운트 시 scope를 해제합니다. 컴포넌트가 이미 언마운트된 뒤에 비동기 등록이 끝나는 경

Key points:
• `exposedTo`에 정확한 소비자 origin을 등록합니다(HTTPS만 허용하며, 로컬
• iframe을 사용한다면 embedding iframe에 `allow="tools"` 권한을 설정합니다.
• 소비자가 일치하는 `fromOrigins` 요청으로 도구를 검색하게 합니다.