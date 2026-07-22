---
document_id: ko_concept_conventions
category: concept
source_path: ko/concept/conventions.md
character_limit: 1000
last_update: '2026-01-03T06:32:34.906Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

Context-Action Framework Conventions 이 문서는 Context-Action 프레임워크의 핵심 패턴(Actions, Stores)과 고급 패턴(RefContext 등)을 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다. 📋 목차 1. 네이밍 컨벤션 2. 파일 구조 3. 패턴 사용법 4. 타입 정의 5. 코드 스타일 6. Import와 모듈 패턴 7. 핵심 프레임워크 원칙 8. Action Handler Registration 컨벤션 9. Store 업데이트 컨벤션 10. 성능 가이드라인 11. 에러 핸들링 12. RefContext 컨벤션 --- 네이밍 컨벤션 🏷️ 리네이밍 패턴 (Renaming Pattern) Context-Action 프레임워크의 핵심 컨벤션은 세 가지 패턴

Key points:
• **트리 쉐이킹**: 번들러가 사용되지 않는 내보내기를 더 효율적으로 제거
• **번들 크기**: 사용되지 않는 코드를 제외하여 최종 번들 크기 감소
• **정적 분석**: 사용되지 않는 import 감지를 위한 더 나은 IDE 지원
• **성능**: 더 빠른 빌드 시간과 런타임 성능
• **트리 쉐이킹**: 개별 함수를 독립적으로 트리 쉐이킹 가능
• **린팅 준수**:...