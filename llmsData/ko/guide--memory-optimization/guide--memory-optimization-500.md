---
document_id: guide--memory-optimization
category: guide
source_path: ko/guide/patterns/ref/memory-optimization.md
character_limit: 500
last_update: '2025-08-26T00:34:27.363Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext를 사용한 메모리 최적화

최적의 RefContext 성능을 위한 메모리 효율적 패턴과 기술입니다. 선행 요건

메모리 최적화 패턴을 구현하기 전에 적절한 RefContext 설정이 있는지 확인하세요:

👉 설정 가이드: RefContext 설정

이 가이드는 설정 사양의 다음 사전 정의된 타입을 사용합니다:
- WorkerRefs: 백그라운드 처리를 위한 웹 워커 관리
- ServiceRefs: 외부 서비스 및 라이브러리 관리
- CanvasRefs: 그래픽을 위한 캔버스 요소 관리
- MediaRefs: 미디어 요소 및 스트림 관리

메모리 관리 기본 사항

RefContext는 자동 정리를 제공하지만, 메모리 패턴을 이해하면 대규모 애플리케이션에 최적화할 수 있습니다.
