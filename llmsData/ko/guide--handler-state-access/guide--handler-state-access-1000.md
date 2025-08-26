---
document_id: guide--handler-state-access
category: guide
source_path: ko/guide/patterns/action/handler-state-access.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.358Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 핸들러 상태 접근 패턴

일반적인 함정을 피하기 위한 중요한 모범 사례를 포함한 액션 핸들러 내에서 상태에 접근하고 관리하는 고급 패턴입니다. Import

필수 조건

🎯 스펙 재사용: 완전한 액션 핸들러 설정 패턴은 기본 액션 설정을 참조하세요. 📖 이 문서의 모든 예제는 아래 설정 스펙을 재사용합니다:
- 🎯 액션 타입 → EventActions, UserActions
- 🎯 훅 명명 → useEventAction 패턴
- 🎯 핸들러 패턴 → 액션 핸들러 설정

💡 일관된 학습: 설정 가이드를 먼저 읽으면 이 문서의 모든 예제를 즉시 이해할 수 있습니다. 📋 목차

1. 중요: 클로저 함정 피하기
2. 실시간 상태 접근 패턴
3. useEffect 의존성 모범 사례

---

중요: 클로저 함정 피하기

⚠️ 클로저 함정 문제

액션 핸들러 내에서 스토어 값에 접근할 때, 컴포넌트 스코프의 값을 사용하지 마세요 - 오래된 데이터가 있는 클로저 함정을 만듭니다. 🔍 왜 클로저 함정이 발생하는가

1. 핸들러 등록 시점: 핸들러가 등록 시점에 렉시컬 스코프에서 변수를 캡처
2. 오래된 참조: 컴포넌트 상태 값이 핸들러 클로저 내부에서 업데이트되지 않음
3.
