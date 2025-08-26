---
document_id: guide--performance
category: guide
source_path: ko/guide/patterns/ref/performance.md
character_limit: 500
last_update: '2025-08-26T00:34:27.367Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext 성능 최적화

60fps+ 상호작용을 위한 종합적인 성능 패턴과 최적화 기술입니다. 선행 요건

성능 패턴을 구현하기 전에 적절한 RefContext 설정을 확인하세요:

필수 설정: RefContext 설정 검토:
- 성능 도메인 RefContext 생성
- 프로바이더 구성 패턴  
- 지연 초기화 기술
- 서비스 및 워커 관리

타입 정의: 설정의 사전 정의된 타입 사용:
- PerformanceRefs - 캔버스, 워커, WASM 모듈 refs
- WorkerRefs - 백그라운드 처리 워커
- WASMRefs - WebAssembly 모듈 refs

개요

RefContext 성능 패턴은 하드웨어 가속, 효율적인 DOM 조작, React 리렌더링 없음을 통해 일관된 60fps 성능 달성에 중점을 둡니다.
