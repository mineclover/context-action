---
document_id: concept--conventions
category: concept
source_path: ko/concept/conventions.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.382Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

이 문서는 Context-Action 프레임워크의 세 가지 핵심 패턴(Actions, Stores, RefContext)을 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다. 📋 목차

1. 네이밍 컨벤션
2. 파일 구조
3. 패턴 사용법
4. 타입 정의
5. 코드 스타일
6. 성능 가이드라인
7. 에러 핸들링
8. RefContext 컨벤션

---

네이밍 컨벤션

🏷️ 리네이밍 패턴 (Renaming Pattern)

Context-Action 프레임워크의 핵심 컨벤션은 세 가지 패턴 모두에 대한 도메인별 리네이밍 패턴입니다. ✅ Store Pattern 리네이밍

✅ Action Pattern 리네이밍

✅ RefContext Pattern 리네이밍

🎯 컨텍스트 이름 규칙

도메인 기반 네이밍

Action vs Store vs RefContext 구분

🔤 Hook 네이밍 패턴

Store Hook 네이밍

Action Hook 네이밍

RefContext Hook 네이밍

---

파일 구조

📁 권장 디렉토리 구조

📄 파일명 컨벤션

Context 파일명

Provider 파일명

---

패턴 사용법

🎯 패턴 선택 가이드

Store Only Pattern

Action Only Pattern  

Pattern Composition

🔄 Provider 조합 패턴

HOC 패턴 (권장)

Manual Provider 조합

---

타입 정의

🏷️ Interface 네이밍

Action Payload Map

Store Data Interface

🎯 제네릭 타입 사용

---

코드 스타일

✨ 컴포넌트 패턴

Store 사용 패턴

Action Handler 패턴

🎨 Import 정리

---

성능 가이드라인

⚡ Store 최적화

Comparison Strategy 선택

메모이제이션 패턴

🔄 Action 최적화

Debounce/Throttle 설정

---

🧪 타입 테스트 및 검증

✅ 타입 안전성 검증

컴파일 타임 타입 테스트

런타임 에러 처리 개선

🔍 디버깅 도구

개발 모드 로깅

---

에러 핸들링

🚨 Error Boundary 패턴

🛡️ Action Error 처리

---

RefContext 컨벤션

🔧 RefContext 전용 가이드라인

Ref 타입 정의

성능 중심 패턴

RefContext 에러 처리

⚡ RefContext 성능 최적화

제로 리렌더링 DOM 조작

---

📚 추가 리소스

관련 문서
- Pattern Guide - 상세한 패턴 사용법
- Full Architecture Guide - 완전한 아키텍처 가이드
- Hooks Reference - Hooks 참조 문서
- API Reference - API 문서

예제 프로젝트
- Basic Example - 기본 사용 예제
- Advanced Patterns - 고급 패턴 예제

마이그레이션 가이드
- Legacy Pattern Migration - 레거시 패턴에서 마이그레이션

---

❓ FAQ

Q: 언제 Store Only vs Action Only vs RefContext vs Composition을 사용해야 하나요. - Store Only: 순수 상태 관리 (폼, 설정, 캐시)
- Action Only: 순수 이벤트 처리 (로깅, 트래킹, 알림)  
- RefContext Only: 고성능 DOM 조작 (애니메이션, 실시간 상호작용)
- Composition: 여러 패턴이 필요한 복잡한 비즈니스 로직 (사용자 관리, 상호작용형 쇼핑카트)

Q: 리네이밍 패턴을 꼭 사용해야 하나요. 네, 리네이밍 패턴은 Context-Action 프레임워크의 핵심 컨벤션입니다. 타입 안전성과 개발자 경험을 크게 향상시킵니다. Q: 성능 최적화는 어떻게 해야 하나요. 1. 적절한 comparison strategy 선택
2.
