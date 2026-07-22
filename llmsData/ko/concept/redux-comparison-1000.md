---
document_id: ko_concept_redux-comparison
category: concept
source_path: ko/concept/redux-comparison.md
character_limit: 1000
last_update: '2025-08-30T10:57:10.136Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action vs Redux: 기능 비교

Context-Action vs Redux: 기능 비교 핵심 철학 차이점 Redux: 전역 단일 스토어 - 단일 진실 소스: 전체 애플리케이션 상태를 위한 하나의 전역 스토어 - 중앙 집중식 상태 관리: 모든 상태가 한 곳에 존재 - 전역 액션 디스패칭: 액션이 전역 상태 트리에 영향 - 불변 상태 업데이트: 리듀서를 통한 불변 업데이트로 상태 변경 Context-Action: 컨텍스트 범위 관리 - 다중 컨텍스트 경계: 특정 React 컨텍스트 경계로 범위가 지정된 상태 - 분산 상태 관리: 도메인별 컨텍스트에 분산된 상태 - 컨텍스트 로컬 액션: 특정 컨텍스트 내에서 처리되는 액션 - 유연한 상태 업데이트: 선택적 불변성을 가진 직접 스토어 업데이트 기능 지원 매트릭스 상태 관리 기능 | 기능 | Redux |

Key points:
• **단일 진실 소스**: 전체 애플리케이션 상태를 위한 하나의 전역 스토어
• **중앙 집중식 상태 관리**: 모든 상태가 한 곳에 존재
• **전역 액션 디스패칭**: 액션이 전역 상태 트리에 영향
• **불변 상태 업데이트**: 리듀서를 통한 불변 업데이트로 상태 변경
• **다중 컨텍스트 경계**: 특정 React 컨텍스트 경계로 범위가 지정된 상태
• **분산 상태 관리**:...