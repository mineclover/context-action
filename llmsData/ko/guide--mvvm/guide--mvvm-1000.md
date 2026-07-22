---
document_id: guide--mvvm
category: guide
source_path: ko/guide/patterns/architecture/mvvm.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.365Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
MVVM 아키텍처 패턴

Context-Action 프레임워크의 세 가지 핵심 패턴을 사용한 Model-View-ViewModel (MVVM) 아키텍처 패턴으로 완벽한 레이어 분리를 구현합니다. 패턴 개요

MVVM은 명확한 관심사 분리를 통해 복잡한 애플리케이션을 구축하는 구조적 접근 방식을 제공합니다:

- Model Layer: 반응형 상태 관리를 위한 Store Only 패턴
- ViewModel Layer: 비즈니스 로직과 조정을 위한 Action Only 패턴
- Performance Layer: 직접 DOM 조작과 싱글톤 객체 관리를 위한 RefContext 패턴
- View Layer: UI 표현을 위한 순수 React 컴포넌트

아키텍처 흐름

사전 요구사항

타입 정의, 멀티 레이어 컨텍스트, 프로바이더 구성을 포함한 완전한 MVVM 설정 지침은 Multi-Context Setup - MVVM Architecture를 참조하세요.
