---
document_id: ko_concept_conventions
category: concept
source_path: ko/concept/conventions.md
character_limit: 2000
last_update: '2026-01-03T06:32:34.907Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

Context-Action Framework Conventions 이 문서는 Context-Action 프레임워크의 핵심 패턴(Actions, Stores)과 고급 패턴(RefContext 등)을 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다. 📋 목차 1. 네이밍 컨벤션 2. 파일 구조 3. 패턴 사용법 4. 타입 정의 5. 코드 스타일 6. Import와 모듈 패턴 7. 핵심 프레임워크 원칙 8. Action Handler Registration 컨벤션 9. Store 업데이트 컨벤션 10. 성능 가이드라인 11. 에러 핸들링 12. RefContext 컨벤션 --- 네이밍 컨벤션 🏷️ 리네이밍 패턴 (Renaming Pattern) Context-Action 프레임워크의 핵심 컨벤션은 세 가지 패턴 모두에 대한 도메인별 리네이밍 패턴입니다. ✅ Store Pattern 리네이밍 ✅ Action Pattern 리네이밍 ✅ RefContext Pattern 리네이밍 🎯 컨텍스트 이름 규칙 도메인 기반 네이밍 Action vs Store vs RefContext 구분 🔤 Hook 네이밍 패턴 Store Hook 네이밍 Action Hook 네이밍 RefContext Hook 네이밍 --- 파일 구조 📁 권장 디렉토리 구조 📄 파일명 컨벤션 Context 파일명 Provider 파일명 --- 패턴 사용법 🎯 패턴 선택 가이드 Store Only Pattern Action Only Pattern   Pattern Composition 🔄 Provider 조합 패턴 HOC 패턴 (권장) Manual Provider 조합 --- 타입 정의 🏷️ Interface 네이밍 Action Payload Map Store Data Interface 🎯 제네릭 타입 사용 --- 코드 스타일 ✨ 컴포넌트 패턴 Store 사용 패턴 Action Handler 패턴 🎨 Import 정리 Import와 모듈 패턴 📦 Import 및 모듈 패턴 Named Import

Key points:
• **트리 쉐이킹**: 번들러가 사용되지 않는 내보내기를 더 효율적으로 제거
• **번들 크기**: 사용되지 않는 코드를 제외하여 최종 번들 크기 감소
• **정적 분석**: 사용되지 않는 import 감지를 위한 더 나은 IDE 지원
• **성능**: 더 빠른 빌드 시간과 런타임 성능
• **트리 쉐이킹**: 개별 함수를 독립적으로 트리 쉐이킹 가능
• **린팅 준수**: "static-only class" 린팅 경고 방지
• **함수형 프로그래밍**: 함수형 프로그래밍 패턴 촉진
• **단순성**: 더 깔끔한 import 문과 사용법
• **테스팅**: 개별 함수를 모킹하고 테스트하기 쉬움
• **모든 로직을 Context-Action 시스템으로 위임**
• 컴포넌트는 순수하게 UI 렌더링에만 집중
• Props 의존성을 극단적으로 최소화
• **상위 컨텍스트는 하위 컨텍스트를 모른다**
• **하위 컨텍스트가 상위 컨텍스트 데이터를 활용**
• 느슨한 결합과 높은 재사용성 확보
• ✅ 언마운트 시 자동 정리