---
document_id: concept--architecture-guide
category: concept
source_path: ko/concept/architecture-guide.md
character_limit: 2000
last_update: '2026-07-20T04:39:35.821Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action 스토어 통합 아키텍처

Context-Action 스토어 통합 아키텍처 1. 개요 및 핵심 개념 Context-Action 아키텍처란? Context-Action 프레임워크는 문서 중심의 컨텍스트 분리와 효과적인 아티팩트 관리를 통해 기존 라이브러리의 근본적인 한계를 극복하도록 설계된 혁신적인 상태 관리 시스템입니다. 프로젝트 철학 Context-Action 프레임워크는 현대 상태 관리의 중요한 문제들을 해결합니다: 기존 라이브러리의 문제점: - 높은 React 결합도: 강한 통합으로 컴포넌트 모듈화와 props 처리가 어려움 - 이진 상태 접근법: 단순한 전역/로컬 상태 이분법으로는 특정 범위 기반 분리를 처리하기 어려움   - 부적절한 핸들러/트리거 관리: 복잡한 상호작용과 비즈니스 로직 처리에 대한 부족한 지원 Context-Action의 솔루션: - 문서-아티팩트 중심 설계: 문서 테마와 결과물 관리를 기반으로 한 컨텍스트 분리 - 완벽한 관심사 분리:    - 뷰 디자인 격리 → 디자인 컨텍스트   - 개발 아키텍처 격리 → 아키텍처 컨텍스트   - 비즈니스 로직 격리 → 비즈니스 컨텍스트     - 데이터 검증 격리 → 검증 컨텍스트 - 명확한 경계: 구현 결과가 뚜렷하고 잘 정의된 도메인 경계를 유지 - 효과적인 문서-아티팩트 관리: 문서와 결과물 간의 관계를 적극적으로 지원하는 상태 관리 라이브러리 아키텍처 구현 프레임워크는 완전한 도메인 격리를 위한 세 가지 핵심 패턴을 통해 MVVM에서 영감을 받은 패턴으로 깔끔한 관심사 분리를 구현합니다: - 액션은 createActionContext를 통해 비즈니스 로직과 조정을 처리 (ViewModel 레이어) - 선언적 스토어 패턴은 createStoreContext을 통해 도메인 격리로 상태를 관리 (Model 레이어) - RefContext는 createRefContext를 통해 제로 리렌더링으로 직접 DOM 조작 제공 (Performance 레이어) - 컴포넌트는 UI를 렌더링 (View 레이어) - 컨텍스트 경계는 기능 도메

Key points:
• **높은 React 결합도**: 강한 통합으로 컴포넌트 모듈화와 props 처리가 어려움
• **이진 상태 접근법**: 단순한 전역/로컬 상태 이분법으로는 특정 범위 기반 분리를 처리하기 어려움
• **부적절한 핸들러/트리거 관리**: 복잡한 상호작용과 비즈니스 로직 처리에 대한 부족한 지원
• **문서-아티팩트 중심 설계**: 문서 테마와 결과물 관리를 기반으로 한 컨텍스트 분리
• **완벽한 관심사 분리**:
• **명확한 경계**: 구현 결과가 뚜렷하고 잘 정의된 도메인 경계를 유지
• **효과적인 문서-아티팩트 관리**: 문서와 결과물 간의 관계를 적극적으로 지원하는 상태 관리 라이브러리
• **액션**은 `createActionContext`를 통해 비즈니스 로직과 조정을 처리 (ViewModel 레이어)
• **선언적 스토어 패턴**은 `createStoreContext`을 통해 도메인 격리로 상태를 관리 (Model 레이어)
• **RefContext**는 `createRefContext`를 통해 제로 리렌더링으로 직접 DOM 조작 제공 (Performance 레이어)
• **컴포넌트**는 UI를 렌더링 (View 레이어)
• **컨텍스트 경계**는 기능 도메인을 격리
• **타입...