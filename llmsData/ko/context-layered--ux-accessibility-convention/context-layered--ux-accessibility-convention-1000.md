---
document_id: context-layered--ux-accessibility-convention
category: context-layered
source_path: ko/context-layered/ux-accessibility-convention.md
character_limit: 1000
last_update: '2026-11-01T07:56:08.500Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
UX 의도·암묵적 합의·접근성 설계 컨벤션

UX 의도·암묵적 합의·접근성 설계 컨벤션 상태: Active 최근 검토: 2026-11-01 범위: interactive example, 공개 UI, 데모, workflow view 이 컨벤션은 사용자가 구현을 읽지 않고도 예상해야 하는 동작을 명시합니다. 빠른 조작이나 편리한 UX가 키보드·스크린 리더·포커스·복구 경로를 조용히 잃게 만들지 않도록 UX 의도와 접근성 계약을 같은 기록 단위로 관리합니다. 사용할 때 다음 중 하나라도 추가하거나 변경하면 사용합니다. - 자동 실행, live update, debounce, background feedback - 새 control, 상태, 오류, reset, recovery 경로 - focus 이동, keyboard 동작

Key points:
• 자동 실행, live update, debounce, background feedback
• 새 control, 상태, 오류, reset, recovery 경로
• focus 이동, keyboard 동작, dialog, popover, live region
• 사용자가 서로 다르게 해석할 수 있는 시각 상태
• 확인 단계를 줄이는 대신 명시성이 낮아지는 UX 선택
•...