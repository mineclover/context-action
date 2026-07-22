---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: ko/context-layered/package-boundary-convention.md
character_limit: 2000
last_update: '2026-07-20T17:25:11.401Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패키지 경계 및 코드베이스 관리 컨벤션

패키지 경계 및 코드베이스 관리 컨벤션 상태: 신규 작업과 경계 변경에 적용 범위: workspace package, example, demo, 아키텍처 근거, 문서 ownership Context-Action 저장소에서 패키지 경계는 폴더 구분만이 아니라 ownership과 의존성 경계다. 각 패키지는 하나의 주 책임, 하나의 public contract, 하나의 명확한 검증 경로를 가져야 한다. 1. 경계 규칙 1. 패키지는 하나의 응집된 책임을 소유한다. 서로 다른 책임이 필요하면 작업을 나누거나 아키텍처 decision을 먼저 기록한다. 2. 다른 패키지는 선언된 package export를 통해서만 사용한다. 상대 경로, src/, dist/, test 전용 alias로 다른 패키지를 import하지 않는다. 3. package.json이 runtime, peer, optional, development dependency의 source of truth다. 소스 import와 dependency 선언이 불일치하면 경계 결함이다. 4. exports가 public surface다. export되지 않은 파일은 implementation detail이며 패키지 간 연동 지점으로 사용하지 않는다. 5. package README는 discovery 문서다. 정식 동작·아키텍처 계약은 docs/ 아래 한 개의 authoritative guide가 소유하며 README에 두 번째 사양을 복제하지 않는다. 6. dist/, API reference, LLMS artifact, coverage, generated report는 파생 결과다. 원본과 generator를 수정하고 다시 생성하며 generated 파일을 canonical implementation으로 취급하지 않는다. 7. 패키지 경계 변경은 dependency review, focused proof, 문서 ownership 갱신을 같은 변경에 포함한다. 파일을 옮

Key points:
• `core`는 `react`에 의존하지 않는다.
• `tool-protocol`은 framework-neutral이며 `core`나 `react`에 의존하지 않는다. provider/tool 경계를 소유한다.
• `react`는 `core`, `mutative`를 사용하며 `mutative`는 하위 `mutative-core` runtime만 사용하고 React type을 import하지 않는다.
• `mutative-core`는 upstream 호환성을 유지하며 Context-Action adapter나 React에 의존하지 않는다.
• `sem-foundation-repository`는 contracts를 사용하고 역방향 의존성은 허용하지 않는다.
• `architecture-governance`는 foundation과 SEM을 사용한다. foundation은 capability, policy, Context-Action UI,
• `architecture-governance`와 `sem-doc`은 목적과 계약이 다른 나란한 consumer이며 서로 runtime 의존성을
• 문서 generator는 소스·문서를 읽을 수 있지만 runtime package가...