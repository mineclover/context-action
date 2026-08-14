---
document_id: guide--production-readiness
category: guide
source_path: ko/guide/production-readiness.md
character_limit: 2000
last_update: '2026-08-11T05:13:12.286Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
프로덕션 준비도

프로덕션 준비도 Context-Action은 패키지 경계와 운영 모델이 문제에 맞는 경우 프로덕션 React 애플리케이션 상태 관리에 사용할 수 있습니다. 이 문서는 포괄적인 성능 또는 exactly-once 보장을 주장하지 않고, 현재의 검증된 계약을 설명합니다. 결론 | 워크로드 | 판단 | 필요한 실천 | | --- | --- | --- | | 로컬 React UI·애플리케이션 상태 | 사용 가능 | createStoreContext, useStoreValue, 좁은 컨텍스트 경계를 사용합니다. | | 타입 안전한 액션 조율 | 사용 가능 | 도메인 작업은 핸들러에 두고 취소·타임아웃 의미를 명시합니다. | | React 18/19 SSR·하이드레이션 | 검증 버전에서 사용 가능 | 지원되는 React와 타입 패키지 버전을 릴리즈 코호트에 맞춥니다. | | Undo/redo·고빈도 업데이트 | 앱 측정 후 사용 가능 | 워크로드에 맞게 히스토리·알림 설정을 선택하며 보편적 성능 배수에 의존하지 않습니다. | | 탭·워커·서버 간 durable tool 호출 | 조건부 사용 가능 | Durable 0.2 fence 마이그레이션과 실제 저장소 엔드포인트 검증을 완료합니다. | | 외부 부작용의 exactly-once | 라이브러리만으로 보장하지 않음 | provider idempotency key, inbox/outbox 또는 동등한 계약, 도메인 reconciliation을 사용합니다. | Store와 Action 계층은 상태 소유권, 구독, 액션 핸들링의 경계를 분명히 해야 할 때 적합합니다. 애플리케이션의 인가 모델, 외부 provider의 idempotency 계약, 운영 데이터베이스 소유권을 대체하지는 않습니다. 검증된 안정화 범위 보호된 릴리즈 사전 점검은 엄격한 소스·테스트 타입 검사, React 18/19 호환성 매트릭스, SSR/하이드레이션, 패킹된 ESM/CJS·NodeNext 소비자, 패키지 export, 예제, 워크플로·릴리즈 안전성, durab

Key points:
• React와 durable tool을 독립적으로 올리지 말고 호환되는 패키지 코호트를 고정하고 테스트합니다.
• 정확한 후보 커밋에서 `pnpm release:check`를 실행합니다.
• workspace 테스트만이 아니라 패킹 소비자·React 호환성 검사를 릴리즈 게이트로 사용합니다.
• 애플리케이션이 소유한 staging 환경에서 Redis/PostgreSQL을 검증하고, 자격 증명이나 원본 요청 데이터를 제외한 증거를 기록합니다.
• 외부 부작용을 켜기 전에 durable key, owner ID, retention, prune, 알림, reconciliation 정책을 정합니다.
• 결제·프로비저닝·메일 등 외부에 보이는 mutation에는 provider idempotency key와 도메인 source of truth를 사용합니다.
• React 2와 Durable 0.2는 일반적인 애플리케이션 canary·rollback 절차로 점진 배포합니다.