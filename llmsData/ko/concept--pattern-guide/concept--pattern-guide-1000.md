---
document_id: concept--pattern-guide
category: concept
source_path: ko/concept/pattern-guide.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.385Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
@context-action/react 패턴 가이드

@context-action/react 프레임워크에서 사용 가능한 세 가지 주요 패턴의 완전한 가이드입니다. 📋 빠른 시작 가이드

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| 🎯 Action Only | 스토어 없이 액션 디스패칭 | createActionContext | 이벤트 시스템, 커맨드 패턴 |
| 🏪 Store Only | 액션 없이 상태 관리 | createDeclarativeStorePattern | 순수 상태 관리, 데이터 레이어 |
| 🔧 Ref Context | 제로 리렌더링 직접 DOM 조작 | createRefContext | 고성능 UI, 애니메이션, 실시간 인터랙션 |

참고: 복잡한 애플리케이션의 경우, 최대한의 유연성과 관심사 분리를 위해 패턴들을 조합하여 사용하세요. ---

🎯 Action Only 패턴

언제 사용: 상태 관리 없이 순수 액션 디스패칭 (이벤트 시스템, 커맨드 패턴). 임포트

기능
- ✅ 타입 안전한 액션 디스패칭
- ✅ 액션 핸들러 등록
- ✅ 중단 지원
- ✅ 결과 처리
- ✅ 경량 (스토어 오버헤드 없음)

기본 사용법

🏪 Store Only 패턴

언제 사용: 액션 디스패칭 없이 순수 상태 관리 (데이터 레이어, 단순 상태).
