---
document_id: context-layered--migration-guide
category: context-layered
source_path: ko/context-layered/migration-guide.md
character_limit: 2000
last_update: '2026-07-20T23:30:19.161Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
마이그레이션 가이드: MVVM에서 Context-Layered로

마이그레이션 가이드: MVVM에서 Context-Layered로 이 문서는 기존 MVVM 또는 단순 React Context 구조에서 Context-Layered Architecture로 이동할 때의 기준점을 설명합니다. 핵심은 “한 번에 전부 바꾸는 것”이 아니라, 책임 분리 기준에 맞춰 점진적으로 재배치하는 것입니다. 가장 큰 차이 | 관점 | 기존 MVVM/단순 구조 | Context-Layered | |------|----------------------|-----------------| | 초점 | 개념적 계층 | 구현 가능한 책임 계층 | | 비즈니스 로직 | ViewModel이나 컴포넌트에 섞임 | business와 handlers로 분리 | | 의존성 주입 | context 또는 import에 의존 | props 기반 DI 가능 | | 실행 흐름 | 컴포넌트 중심 | handler 중심 | | 테스트 | 컴포넌트 통합 테스트 위주 | 레이어별 테스트 가능 | 이전 구조와 이후 구조 이전 이후 현재 패키지 경계 migration tool protocol은 framework-neutral 별도 package가 되었습니다. action schema나 MCP/provider adapter가 필요한 경우에만 설치합니다. defineAction, createActionSchema, listAllTools와 protocol type은 @context-action/tool-protocol에서 import합니다. @context-action/react는 createToolContext와 React hook을, @context-action/core는 action runtime을 소유합니다. 기존 Core/React re-export는 제거되었습니다. Durable mutation recovery는 별도의 선택적 package로 분리되었습니다. durable operation record, 프로세스 간 claim, HTTP/queue side-effec

Key points:
• validation
• 계산 규칙
• 상태 전이 규칙
• 도메인별 파생 값 계산
• context 생성 코드가 `contexts/`에 모였는가
• 검증과 계산 로직이 `business/`로 분리되었는가
• API 호출과 store 업데이트가 `handlers/`에 모였는가
• view는 hook과 action만 사용하도록 단순화되었는가
• 테스트가 컴포넌트 하나에 몰리지 않고 레이어별로 분산되었는가
• `views/`에서 store를 직접 update하기
• `handlers/` 안에 검증 규칙을 길게 쓰기
• `actions/` 없이 view에서 dispatch 이름을 직접 남발하기
• `contexts/`에 runtime logic을 넣기
• [React Context 마이그레이션](/ko/guide/react-context-migration)
• [Context-Layered 개요](/ko/context-layered/context-layered-guide)
• [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)