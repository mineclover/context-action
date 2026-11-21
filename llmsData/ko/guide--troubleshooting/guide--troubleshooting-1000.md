---
document_id: guide--troubleshooting
category: guide
source_path: ko/guide/troubleshooting.md
character_limit: 1000
last_update: '2026-11-21T03:32:50.154Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문제 해결 가이드 (Guide Troubleshooting)

문제 해결 가이드 (Guide Troubleshooting) Context-Action 프레임워크를 애플리케이션에 통합할 때 자주 겪는 런타임·메모리·성능 문제와 해결 방법을 정리합니다. 🔧 대표적인 프레임워크 이슈 메모리 누수 및 불필요한 저장 방지 DOM 이벤트 객체 저장 차단 문제: DOM/React 합성 이벤트 객체를 스토어에 통째로 저장하면 메모리 누수 및 직렬화 문제가 발생합니다. 해결: Store는 이벤트 객체 저장 시 경고를 발생시키며, 필요한 원시 값만 추출해서 저장해야 합니다: 핸들러 내부의 오래된 클로저(Stale State) 문제 문제: 컴포넌트 렌더링 시점의 구독 값을 액션 핸들러 클로저에 직접 캡처하면 최신 상태와 어긋납니다. 해결: 핸들러 내부에서는 항상 store.getValue()로 최신 스냅샷을 지연 읽기(lazy evaluation)하세요: 🚨 치명적 성능 및 무한 루프 이슈 세부 증상과 코드 패턴별 해결책은 전용 문제 해결 문서를 참고하세요: - 무한 루프 문제 해결 - 로깅 순환, 토스트 루프, 핸들러 재등록 루프, 타이머 연쇄 및 Store 갱신 루프 해결 - 성능 및 무한 루프 문제 - 메모리 최적화, 과도한 리렌

Key points:
• [무한 루프 문제 해결](/ko/troubleshooting/infinite-loop-issues) - 로깅 순환, 토스트 루프, 핸들러 재등록 루프, 타이머 연쇄 및 Store 갱신 루프 해결
• [성능 및 무한 루프 문제](/ko/troubleshooting/performance-issues) - 메모리 최적화, 과도한 리렌더링 방지, 선택적 구독
• [문제 해결 인덱스](/ko/troubleshooting/)
• [무한 루프 문제](/ko/troubleshooting/infinite-loop-issues)
• [성능 문제](/ko/troubleshooting/performance-issues)
• [액션...