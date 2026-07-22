---
document_id: concept--architecture-guide
category: concept
source_path: ko/concept/architecture-guide.md
character_limit: 1000
last_update: '2026-07-20T04:39:35.821Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action 스토어 통합 아키텍처

Context-Action 스토어 통합 아키텍처 1. 개요 및 핵심 개념 Context-Action 아키텍처란? Context-Action 프레임워크는 문서 중심의 컨텍스트 분리와 효과적인 아티팩트 관리를 통해 기존 라이브러리의 근본적인 한계를 극복하도록 설계된 혁신적인 상태 관리 시스템입니다. 프로젝트 철학 Context-Action 프레임워크는 현대 상태 관리의 중요한 문제들을 해결합니다: 기존 라이브러리의 문제점: - 높은 React 결합도: 강한 통합으로 컴포넌트 모듈화와 props 처리가 어려움 - 이진 상태 접근법: 단순한 전역/로컬 상태 이분법으로는 특정 범위 기반 분리를 처리하기 어려움   - 부적절한 핸들러/트리거 관리: 복잡한 상호작용과 비즈니스 로직 처리에 대한 부족한 지원 Context-Act

Key points:
• **높은 React 결합도**: 강한 통합으로 컴포넌트 모듈화와 props 처리가 어려움
• **이진 상태 접근법**: 단순한 전역/로컬 상태 이분법으로는 특정 범위 기반 분리를 처리하기 어려움
• **부적절한 핸들러/트리거 관리**: 복잡한 상호작용과 비즈니스 로직 처리에 대한 부족한 지원
• **문서-아티팩트 중심 설계**: 문서 테마와 결과물 관리를 기반으로 한 컨텍스트 분리
• **완벽한...