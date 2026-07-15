---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: ko/concept/tool-calling-editor-architecture.md
character_limit: 1000
last_update: '2026-07-15T14:31:24.337Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor 아키텍처

Tool Calling Editor 아키텍처 브라우저 기반 실시간 editor는 iframe이 도구 실행기를 소유하지 않고, 부모 문서가 표준 Tool Registry·정책·호출 추적을 소유하는 구조로 구성한다. 실행 경계 Orca는 여러 coding agent를 worktree, 터미널, embedded browser와 연결하는 ADE다. 이번 구현에서는 전체 데스크톱 구조가 아니라 다음 경계만 참고한다. - Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달 - browser bridge: 브라우저 화면과 호스트 상태를 분리 - agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰 - CLI co

Key points:
• Design Mode의 선택 결과 수집: 선택자, HTML/CSS 요약, 화면 상태를 입력 context로 전달
• browser bridge: 브라우저 화면과 호스트 상태를 분리
• agent lifecycle: 시작·대기·승인·완료·실패 상태를 이벤트로 관찰
• CLI command bridge: 화면 동작을 임의 script가 아닌 명시적 command로 제한
•...