---
document_id: guide--mvvm
category: guide
source_path: ko/guide/patterns/architecture/mvvm.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.366Z'
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

타입 정의, 멀티 레이어 컨텍스트, 프로바이더 구성을 포함한 완전한 MVVM 설정 지침은 Multi-Context Setup - MVVM Architecture를 참조하세요. 이 문서는 MVVM 설정을 사용한 구현 패턴을 보여줍니다:
- 타입 정의 → Complete Type Definitions
- 컨텍스트 생성 → MVVM Context Creation  
- 프로바이더 구성 → Layer-Based Composition

레이어 구현 패턴

Model Layer (데이터 관리)

ViewModel Layer (비즈니스 로직)

Performance Layer (DOM 조작)

View Layer (UI 표현)

애플리케이션 설정

레이어 책임

Model Layer (Store Only 패턴)
- ✅ 반응형 상태 관리
- ✅ 타입 안전한 데이터 컨테이너  
- ✅ 스토어 정의 및 초기값
- ✅ 구독 관리
- ❌ 비즈니스 로직
- ❌ UI 관련 작업
- ❌ 직접 DOM 조작

ViewModel Layer (Action Only 패턴)
- ✅ 비즈니스 로직 구현
- ✅ 액션 핸들러 등록
- ✅ 도메인 간 조정
- ✅ 사이드 이펙트 관리
- ✅ 핸들러를 통한 스토어 업데이트
- ❌ UI 표현
- ❌ 직접 DOM 조작
- ❌ 컴포넌트 라이프사이클

Performance Layer (RefContext 패턴)
- ✅ 직접 DOM 조작
- ✅ 리렌더링 없는 애니메이션
- ✅ 하드웨어 가속
- ✅ 실시간 상호작용
- ✅ 성능이 중요한 업데이트
- ✅ 싱글톤 객체 관리
- ✅ 외부 리소스 지연 평가
- ❌ 비즈니스 로직
- ❌ 상태 관리
- ❌ UI 표현 로직

View Layer (React 컴포넌트)
- ✅ UI 표현 및 구조
- ✅ 이벤트 바인딩 및 디스패치
- ✅ 컴포넌트 라이프사이클 관리
- ✅ 프로바이더 구성
- ❌ 비즈니스 로직
- ❌ 직접 상태 변경
- ❌ 직접 DOM 조작

모범 사례

✅ 구현 모범 사례

1. 명확한 레이어 분리
   - ViewModel 레이어에 비즈니스 로직 유지
   - Model 레이어는 상태 관리만 사용
   - Performance 레이어는 DOM 작업을 위해 예약
   - View 레이어는 순수 표현으로 유지

2. 적절한 데이터 흐름
   - View는 ViewModel로 액션 디스패치
   - ViewModel은 핸들러를 통해 Model 업데이트
   - Model은 구독을 통해 View에 알림
   - Performance 레이어는 DOM에 직접 접근

3. 타입 안전성
   - 각 도메인에 대한 명확한 인터페이스 정의
   - 타입화된 액션 정의 사용
   - DOM 요소 참조를 강타입으로 지정
   - 레이어 간 타입 안전성 유지

❌ 피해야 할 사항

1. 레이어 혼합
   - View 컴포넌트에 비즈니스 로직 넣지 않기
   - ViewModel 핸들러에서 DOM 조작하지 않기
   - Performance 레이어에서 상태 관리하지 않기
   - Model 레이어에서 액션 디스패치하지 않기

2.
