---
document_id: guide--hardware-acceleration
category: guide
source_path: ko/guide/patterns/ref/hardware-acceleration.md
character_limit: 500
last_update: '2025-08-26T00:34:27.359Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext를 사용한 하드웨어 가속

60fps+ 성능을 위한 GPU 가속 DOM 조작 패턴입니다. 선행 요건

하드웨어 가속 패턴을 사용하기 전에 GPU 및 성능 레퍼런스로 RefContext를 설정하세요:

필수 설정: RefContext 설정 - GPURefs, WASMRefs, WorkerRefs 구성

하드웨어 가속 기본 사항

RefContext는 부드럽고 고성능 상호작용을 위해 GPU 가속을 활용할 수 있는 직접 DOM 조작을 가능하게 합니다.
