---
document_id: context-layered--ux-accessibility-convention
category: context-layered
source_path: ko/context-layered/ux-accessibility-convention.md
character_limit: 2000
last_update: '2026-11-01T07:56:08.501Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
UX 의도·암묵적 합의·접근성 설계 컨벤션

UX 의도·암묵적 합의·접근성 설계 컨벤션 상태: Active 최근 검토: 2026-11-01 범위: interactive example, 공개 UI, 데모, workflow view 이 컨벤션은 사용자가 구현을 읽지 않고도 예상해야 하는 동작을 명시합니다. 빠른 조작이나 편리한 UX가 키보드·스크린 리더·포커스·복구 경로를 조용히 잃게 만들지 않도록 UX 의도와 접근성 계약을 같은 기록 단위로 관리합니다. 사용할 때 다음 중 하나라도 추가하거나 변경하면 사용합니다. - 자동 실행, live update, debounce, background feedback - 새 control, 상태, 오류, reset, recovery 경로 - focus 이동, keyboard 동작, dialog, popover, live region - 사용자가 서로 다르게 해석할 수 있는 시각 상태 - 확인 단계를 줄이는 대신 명시성이 낮아지는 UX 선택 단순한 시각 변경은 별도 기록이 없어도 되지만, 소유 specification이나 PR에 영향을 받는 접근성 불변 조건은 남깁니다. 암묵적 합의 기록 암묵적 합의는 구현을 읽지 않아도 사용자가 예상해야 하는 동작입니다. 예를 들어 “checkbox를 바꾸면 실험이 실행된다”, “최신 결과가 기준이다”, “reset은 재현 가능한 실패 상태로 돌아간다”가 있습니다. 상호작용이나 보조기술 출력에 영향을 주면 구현 전에 기록합니다. feature specification, decision record, 또는 PR 본문에 다음 형식을 사용합니다. 리뷰어가 무엇이 동작을 시작하는지, 화면에서 무엇이 바뀌는지, 키보드와 보조기술 사용자가 같은 변화를 어떻게 발견하는지, 잘못 바꿨을 때 어떻게 복구하는지를 답할 수 있어야 기록이 완료됩니다. 설계 규칙 1. 자동 동작은 예측 가능하게 만든다 자동 동작은 트리거 가까이에 설명을 둡니다. 어떤 이벤트가 시작하고 어떤 결과를 바꾸는지 씁니다. 이미 자동으로 실행되는

Key points:
• 자동 실행, live update, debounce, background feedback
• 새 control, 상태, 오류, reset, recovery 경로
• focus 이동, keyboard 동작, dialog, popover, live region
• 사용자가 서로 다르게 해석할 수 있는 시각 상태
• 확인 단계를 줄이는 대신 명시성이 낮아지는 UX 선택
• semantic control과 accessible name:
• keyboard와 비포인터 경로:
• focus 동작:
• 상태/값/오류 알림:
• 색상·모션·대비·텍스트 대체:
• UX 이점:
• 접근성 위험:
• 선택한 해결:
• 배제한 대안과 이유:
• 구현 anchor:
• 동작 테스트: