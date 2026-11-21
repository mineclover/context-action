---
document_id: guide--troubleshooting
category: guide
source_path: ko/guide/troubleshooting.md
character_limit: 500
last_update: '2026-11-21T03:32:50.153Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문제 해결 가이드 (Guide Troubleshooting)

문제 해결 가이드 (Guide Troubleshooting) Context-Action 프레임워크를 애플리케이션에 통합할 때 자주 겪는 런타임·메모리·성능 문제와 해결 방법을 정리합니다. 🔧 대표적인 프레임워크 이슈 메모리 누수 및 불필요한 저장 방지 DOM 이벤트 객체 저장 차단 문제: DOM/React 합성 이벤트 객체를 스토어에 통째로 저장하면 메모리 누수 및 직렬화 문제가 발생합니다. 해결: Store는 이벤트 객체 저장 시 경고를 발생시키며, 필요한 원시 값만 추출해서 저장해야 합니다: 핸들러 내부의 오래된 클로저(Sta

Key points:
• [무한 루프 문제 해결](/ko/troubleshooting/infinite-loop-issues) - 로깅 순환, 토스트 루프, 핸들러 재등록 루프, 타이머 연쇄 및 Store 갱신 루프 해결
• [성능 및 무한 루프...