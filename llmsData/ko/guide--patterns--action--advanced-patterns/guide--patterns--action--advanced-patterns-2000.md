---
document_id: guide--patterns--action--advanced-patterns
category: guide
source_path: ko/guide/patterns/action/advanced-patterns.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.402Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
고급 액션 패턴

고급 액션 패턴 멀티 컨텍스트 설정 기반을 기반으로 구축된 Context-Action 프레임워크의 고급 액션 패턴 개요입니다. 필수 조건 이 가이드는 완전한 멀티 컨텍스트 설정 패턴을 기반으로 합니다. 기본적인 아키텍처와 타입 정의는 다음을 참조하세요: 📚 멀티 컨텍스트 설정 → - 완전한 MVVM 아키텍처, 도메인 분리, 프로바이더 조합 패턴 필수 설정 컴포넌트 이 가이드의 모든 고급 패턴은 다음을 포함한 멀티 컨텍스트 설정이 필요합니다: - MVVM 아키텍처 설정: Model, ViewModel, Performance 레이어 컨텍스트 - 도메인 컨텍스트 아키텍처: User, Product, UI, Business, Validation, Design 도메인 - 프로바이더 조합: 레이어 기반 및 도메인 기반 조합 패턴 - 크로스 컨텍스트 통신: 이벤트 버스 및 컨텍스트 브리지 유틸리티 - 타입 시스템: 스토어, 액션, 참조를 위한 완전한 인터페이스 정의 패턴 카테고리 Context-Action 프레임워크는 멀티 컨텍스트 설정을 활용하는 액션 패턴의 세 가지 주요 카테고리를 제공합니다: 🚀 디스패치 패턴 MVVM 아키텍처 분리와 함께 멀티 컨텍스트 설정을 사용한 크로스 도메인 액션 디스패칭. - 크로스 도메인 실행: User, Product, UI, Business 도메인에 걸쳐 액션 디스패치 - 레이어 인식 필터링: Model, ViewModel, Performance 레이어별 실행 - 멀티 컨텍스트 성능: 공유 이벤트 버스를 통한 도메인 격리 실행 디스패치 패턴 보기 → 📊 결과 수집 패턴 도메인 경계를 넘나드는 복잡한 비즈니스 워크플로우를 위한 고급 결과 집계. - 도메인 결과 집계: User, Product, Business 컨텍스트에서 결과 수집 - 크로스 컨텍스트 검증: 결과 처리와 검증 도메인 통합 - 엔터프라이즈 결과 처리: 도메인 분리를 통한 대규모 데이터 처리 결과와 함께 디스패치 패턴 보기 → ⚙️ 등록 패턴 MVV

Key points:
• **MVVM 아키텍처 설정**: Model, ViewModel, Performance 레이어 컨텍스트
• **도메인 컨텍스트 아키텍처**: User, Product, UI, Business, Validation, Design 도메인
• **프로바이더 조합**: 레이어 기반 및 도메인 기반 조합 패턴
• **크로스 컨텍스트 통신**: 이벤트 버스 및 컨텍스트 브리지 유틸리티
• **타입 시스템**: 스토어, 액션, 참조를 위한 완전한 인터페이스 정의
• **크로스 도메인 실행**: User, Product, UI, Business 도메인에 걸쳐 액션 디스패치
• **레이어 인식 필터링**: Model, ViewModel, Performance 레이어별 실행
• **멀티 컨텍스트 성능**: 공유 이벤트 버스를 통한 도메인 격리 실행
• **도메인 결과 집계**: User, Product, Business 컨텍스트에서 결과 수집
• **크로스 컨텍스트 검증**: 결과 처리와 검증 도메인 통합
• **엔터프라이즈 결과 처리**: 도메인 분리를 통한 대규모 데이터 처리
• **도메인별 구성**: 비즈니스 도메인 기반 우선순위 및 태그
• **레이어 인식 등록**: Model, ViewModel, Performance...