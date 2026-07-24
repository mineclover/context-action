---
document_id: guide--patterns--setup--index
category: guide
source_path: ko/guide/patterns/setup/index.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.392Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
설정 및 구성

설정 및 구성 Context-Action 프레임워크를 위한 공유 설정 패턴과 구성입니다. 개요 이 섹션은 모든 패턴 문서에서 참조할 수 있는 재사용 가능한 설정 패턴을 제공합니다. 모든 문서에서 설정 코드를 중복하는 대신, 이러한 공유 구성이 모든 Context-Action 구현의 기초 역할을 합니다. 사용 가능한 설정 가이드 핵심 설정 패턴 - 기본 액션 설정 - 액션 컨텍스트 설정 패턴 및 타입 정의 - 기본 스토어 설정 - 스토어 컨텍스트 설정 패턴 및 구성 - 다중 컨텍스트 설정 - 대규모 애플리케이션을 위한 복잡한 아키텍처 설정 설정 가이드 사용법 각 설정 가이드는 다음을 제공합니다: 1. 타입 정의 - 일반적인 패턴을 위한 재사용 가능한 인터페이스 정의 2. 컨텍스트 생성 - 네이밍 컨벤션을 가진 표준 컨텍스트 생성 패턴 3. 프로바이더 설정 - 프로바이더 구성 및 조직 패턴 4. 내보내기 패턴 - 컨텍스트와 훅 내보내기를 위한 모범 사례 5. 구성 옵션 - 다양한 시나리오를 위한 고급 구성 설정 가이드 사용 방법 1. 패턴 문서에서 참조 패턴 문서는 구성 코드를 중복하는 대신 이러한 설정 가이드를 참조합니다: 2. 복사 및 사용자 정의 제공된 패턴을 시작점으로 사용하고 특정 도메인에 맞게 사용자 정의하세요: 3. 공유 타입 임포트 공유 타입 정의를 임포트하고 확장하세요: 설정 패턴 카테고리 단일 컨텍스트 패턴 하나의 컨텍스트 타입을 사용하는 애플리케이션용: - 간단한 액션 디스패칭 → 기본 액션 설정 - 기본 상태 관리 → 기본 스토어 설정 다중 컨텍스트 패턴 여러 컨텍스트를 사용하는 애플리케이션용: - MVVM 아키텍처 → 다중 컨텍스트 설정 - 도메인 주도 설계 → 다중 컨텍스트 설정 - 엔터프라이즈 애플리케이션 → 다중 컨텍스트 설정 고급 패턴 복잡한 애플리케이션용: - 컨텍스트 간 통신 → 다중 컨텍스트 설정 - 성능 최적화 → 다중 컨텍스트 설정 (RefContext) - 프로바이더 구성 → 모든 설정 가이드에 구성 패턴 포함 구성 모범 사례 타

Key points:
• **[기본 액션 설정](./basic-action-setup.md)** - 액션 컨텍스트 설정 패턴 및 타입 정의
• **[기본 스토어 설정](./basic-store-setup.md)** - 스토어 컨텍스트 설정 패턴 및 구성
• **[다중 컨텍스트 설정](./multi-context-setup.md)** - 대규모 애플리케이션을 위한 복잡한 아키텍처 설정
• 간단한 액션 디스패칭 → **[기본 액션 설정](./basic-action-setup.md)**
• 기본 상태 관리 → **[기본 스토어 설정](./basic-store-setup.md)**
• MVVM 아키텍처 → **[다중 컨텍스트 설정](./multi-context-setup.md#mvvm-architecture-setup)**
• 도메인 주도 설계 → **[다중 컨텍스트 설정](./multi-context-setup.md#domain-context-architecture-setup)**
• 엔터프라이즈 애플리케이션 → **[다중 컨텍스트 설정](./multi-context-setup.md#conditional-multi-context-setup)**
• 컨텍스트 간 통신 → **[다중 컨텍스트...