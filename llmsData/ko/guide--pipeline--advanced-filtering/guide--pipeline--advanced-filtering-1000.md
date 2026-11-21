---
document_id: guide--pipeline--advanced-filtering
category: guide
source_path: ko/guide/pipeline/advanced-filtering.md
character_limit: 1000
last_update: '2026-11-21T07:28:37.985Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
고급 필터링 시스템

고급 필터링 시스템 ActionRegister에서 디스패치별로 실행할 핸들러를 정밀하게 제어하는 고급 필터링 가이드입니다. 🎯 개요 DispatchOptions['filter']를 사용하면 매 디스패치마다 우선순위 범위, 핸들러 ID 포함/제외, 또는 Readonly<ResolvedHandlerConfig>를 인자로 받는 커스텀 판별 함수를 기준으로 등록된 핸들러의 부분집합만 실행할 수 있습니다. > [!IMPORTANT] Admission Guard 불변식 > register.registerGuard(...)로 등록된 검증/인가 가드(guard) 는 options.filter로 절대 우회할 수 없습니다. 필터링은 가드가 아닌 핸들러(커맨드, 결과 핸들러, 옵저버)에만 적용됩니다. 🔧 필터 유형 우선순위 범위 필터링 priority 범위(min / max, 경계 포함)를 지정해 실행 대상을 제한합니다: <!-- @context-action-compile --> 핸들러 ID 필터링 등록된 핸들러의 id를 기준으로 특정 핸들러만 포함하거나 제외합니다: <!-- @context-action-compile --> 커스텀 로직 필터링 id, priority, bl

Key points:
• 가능한 경우 커스텀 문자열 파싱 대신 `ActionRegister` 내부의 `Set` 조회를 사용하는 `handlerIds` / `excludeHandlerIds`와 `priority` 범위를 우선 사용하세요.
• 자주 쓰는 `Set`과 `custom` 판별 함수는 모듈 스코프에 재사용해 디스패치마다 새 객체/정규식을 생성하지 않도록 합니다.
• **가드 보존 원칙**: 유효성 검증이나 권한 확인 로직은 `registerGuard()`로 등록해야 디스패치 필터로 실수로 건너뛰는 일을 막을 수 있습니다.
• **빈 결과 감지**: 필터가 모든 핸들러를 제외할 때 대체 경로가 필요하면 `dispatchWithResult`의...