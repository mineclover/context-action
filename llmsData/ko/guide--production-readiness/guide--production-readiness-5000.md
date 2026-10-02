---
document_id: guide--production-readiness
category: guide
source_path: ko/guide/production-readiness.md
character_limit: 5000
last_update: '2026-10-02T01:34:57.627Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
프로덕션 준비도

프로덕션 준비도 Context-Action은 패키지 경계와 운영 모델이 문제에 맞는 경우 프로덕션 React 애플리케이션 상태 관리에 사용할 수 있습니다. 이 문서는 포괄적인 성능 또는 exactly-once 보장을 주장하지 않고, 현재의 검증된 계약을 설명합니다. 결론 | 워크로드 | 판단 | 필요한 실천 | | --- | --- | --- | | 로컬 React UI·애플리케이션 상태 | 사용 가능 | createStoreContext, useStoreValue, 좁은 컨텍스트 경계를 사용합니다. | | 타입 안전한 액션 조율 | 사용 가능 | 도메인 작업은 핸들러에 두고 취소·타임아웃 의미를 명시합니다. | | React 19.2 SSR·하이드레이션 | 검증 버전에서 사용 가능 | 지원되는 React와 타입 패키지 버전을 릴리즈 코호트에 맞춥니다. | | Undo/redo·고빈도 업데이트 | 앱 측정 후 사용 가능 | 워크로드에 맞게 히스토리·알림 설정을 선택하며 보편적 성능 배수에 의존하지 않습니다. | | 탭·워커·서버 간 durable tool 호출 | 개발 트랙 | 별도 릴리즈 결정을 하기 전에 Durable 0.2 fence 마이그레이션과 실제 저장소 엔드포인트 검증을 완료합니다. | | 외부 부작용의 exactly-once | 라이브러리만으로 보장하지 않음 | provider idempotency key, inbox/outbox 또는 동등한 계약, 도메인 reconciliation을 사용합니다. | Store와 Action 계층은 상태 소유권, 구독, 액션 핸들링의 경계를 분명히 해야 할 때 적합합니다. 애플리케이션의 인가 모델, 외부 provider의 idempotency 계약, 운영 데이터베이스 소유권을 대체하지는 않습니다. 검증된 안정화 범위 보호된 릴리즈 사전 점검은 엄격한 소스·테스트 타입 검사, React 19.2 최소/현재 호환성 매트릭스, SSR/하이드레이션, 패킹된 ESM/CJS·NodeNext 소비자, 패키지 export, 예제, 워크플로·릴리즈 안전성, durable adapter 검증을 포함합니다. Redis와 PostgreSQL adapter도 CI 서비스 컨테이너에서 검증합니다. 이 근거는 후보 커밋의 라이브러리 계약을 뒷받침합니다. 프로덕션 배포 전에는 정확한 릴리즈 후보에서 같은 사전 점검을 실행하고, staging 또는 프로덕션과 동등한 Redis/PostgreSQL 엔드포인트에서 자격 증명, TLS, 마이그레이션, 보존, failover 동작을 검증해야 합니다. 현재 상태 관리 릴리즈 현재 stable 릴리즈는 상태 관리 표면입니다. | 패키지 | 버전 | 의미 | | --- | --- | --- | | @context-action/core | 1.2.6 | 안정화된 액션 lifecycle·dispatch trace·observer 의미론 | | @context-action/store-core | 0.1.3 | framework-neutral state·patch·timeline backend 계약 | | @context-action/mutative-core | 0.8.14 | upstream mutative@1.3.0 호환성 기준과 유지보수 fork 수정 | | @context-action/mutative | 0.8.15 | defensive collection snapshot, immutable update, timeline batch | | @context-action/react | 4.0.7 | React lifecycle·backend notification·declaration·SSR 계약 | upstream 기준과 scoped package 버전은 별도 계약입니다. mutative@1.3.0은 인수한 source baseline이며 runtime dependency나 scoped adapter 버전이 아닙니다. core lock과 유지 patch는 pnpm verify:mutative-upstream으로 검증합니다. Durable Operations 0.2와 연계된 tool protocol 작업은 적극 개발 중이며, 일반 Store·Action·React 19.2·SSR 사용의 선행 조건이 아닙니다. 책임과 기능 계약 배포 경계는 의도적으로 좁게 잡았습니다. 애플리케이션을 설계할 때 아래 표를 선택 기준으로 사용하고, 한 패키지가 다음 행의 책임을 암묵적으로 떠안지 않게 하십시오. | 관심사 | 소유자 | 기능 | 명시적으로 책임지지 않는 것 | | --- | --- | --- | --- | | 액션 실행 | @context-action/core | 핸들러 등록·실행 순서, 취소, 타임아웃, 결과, observer lifecycle을 제공합니다. | React 렌더링, 상태 영속화, tool schema, provider 호출, 인가 | | React 상태·합성 | @context-action/react 4.0 | Store/Action context를 만들고 React 구독을 연결하며 검증된 React 19.2·SSR lifecycle 계약을 제공합니다. | DB 기반 작업, 프로세스 간 복구, provider/tool runtime | | 애플리케이션 도메인 | 애플리케이션 | 상태 모양, 비즈니스 규칙, 인가, API client, 성공·실패의 의미를 정의합니다. | 일반 Store나 action registry에 비즈니스 정책을 위임하는 일 | | Tool protocol — 개발 트랙 | @context-action/tool-protocol | provider 중립 tool schema, 직렬화, 승인, 관측 가능한 protocol metadata를 정의합니

Key points:
• Core `1.2.6`, Store Core `0.1.3`, Mutative Core `0.8.14`, scoped adapter `0.8.15`, React `4.0.7`을 함께 고정하고 테스트합니다.
• 정확한 후보 커밋에서 `pnpm release:check`를 실행합니다.
• workspace 테스트만이 아니라 패킹 소비자·React 호환성 검사를 릴리즈 게이트로 사용합니다.
• 이 cohort는 일반적인 애플리케이션 canary·rollback 절차로 점진 배포합니다.