---
document_id: guide--performance
category: guide
source_path: ko/guide/patterns/ref/performance.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.368Z'
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

RefContext 성능 패턴은 하드웨어 가속, 효율적인 DOM 조작, React 리렌더링 없음을 통해 일관된 60fps 성능 달성에 중점을 둡니다. 성능 아키텍처

리렌더링 없음 철학

RefContext 패턴은 DOM 조작을 위해 React의 렌더링 사이클을 완전히 우회하는 성능 우선 레이어를 도입합니다:

성능 비교

| 방식 | React 리렌더링 | 성능 | 메모리 | 복잡성 |
|----------|------------------|-------------|---------|------------|
| useState | 매번 업데이트 | 30fps | 높은 GC | 간단 |
| useRef | 수동 확인 | 45fps | 보통 | 보통 |
| RefContext | 없음 | 60fps+ | 낮음 | 최적화됨 |

성능 최적화 영역

🎨 캔버스 최적화
즉각적인 시각적 피드백 패턴으로 캔버스 상호작용 지연을 해결하는 실제 사례 연구입니다.
