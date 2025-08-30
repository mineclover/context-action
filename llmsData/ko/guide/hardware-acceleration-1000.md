---
document_id: ko_guide_hardware-acceleration
category: guide
source_path: ko/guide/patterns/ref/hardware-acceleration.md
character_limit: 1000
last_update: '2025-08-30T10:45:53.496Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext를 사용한 하드웨어 가속

RefContext를 사용한 하드웨어 가속 60fps+ 성능을 위한 GPU 가속 DOM 조작 패턴입니다. 선행 요건 하드웨어 가속 패턴을 사용하기 전에 GPU 및 성능 레퍼런스로 RefContext를 설정하세요: 필수 설정: RefContext 설정 - GPURefs, WASMRefs, WorkerRefs 구성 하드웨어 가속 기본 사항 RefContext는 부드럽고 고성능 상호작용을 위해 GPU 가속을 활용할 수 있는 직접 DOM 조작을 가능하게 합니다. GPU 가속 속성 하드웨어 가속 마우스 추적 GPU 레이어 관리 컴포지트 레이어 생성 레이어 최적화 GPU를 사용한 부드러운 애니메이션 하드웨어 가속 전환 GPU 작업 배치 WebAssembly 하드웨어 가속 WASM 기반 이미지 처리 워커 기반 

Key points:
• **[RefContext 설정](../setup/ref-context-setup.md)** - GPURefs, WASMRefs, WorkerRefs를 위한 필수 설정
• [캔버스 최적화](./canvas-optimization.md) - CanvasRefs를 사용한 캔버스 특화 성능
• [메모리 최적화](./memory-optimization.md) - 설정 정리를 통한 메모리 효율적...