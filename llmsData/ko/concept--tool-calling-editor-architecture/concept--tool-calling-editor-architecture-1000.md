---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: ko/concept/tool-calling-editor-architecture.md
character_limit: 1000
last_update: '2026-07-20T18:03:43.580Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor 아키텍처

Tool Calling Editor 아키텍처 브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다. 이 데모에서 재사용할 Context-Action 규칙과 use-case recipe는 Tool Calling Web Studio 컨벤션에서 확인할 수 있다. 실행 경계 ToolCallResult.content는 text와 JSON content block을 모두 허용한다. structuredContent가 있으면 provider가 이를 사용할 수 있지만, structured output이 없을 때는 content block을 유지해야 한다. canonical runtime g

Key points:
• Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달
• browser bridge: 브라우저 화면과 호스트 상태를 분리
• agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰
• CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한
•...