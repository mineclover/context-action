---
document_id: context-layered--interaction-intent-contract
category: context-layered
source_path: ko/context-layered/interaction-intent-contract.md
character_limit: 1000
last_update: '2026-11-01T08:35:37.880Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
상호작용 의도 계약(IIC) 컨벤션

상호작용 의도 계약(IIC) 컨벤션 상태: Active 최근 검토: 2026-11-01 범위: interactive example, 공개 UI, 데모, workflow view 이 컨벤션에서 말하는 접근성은 스크린 리더 대응만을 뜻하지 않습니다. 디자인을 만든 사람이 아니어도 왜 버튼이나 설명을 줄였는지, 어떤 직관적 반응을 약속했는지, 그 선택을 어떻게 되돌리고 검증하는지 다시 이해할 수 있어야 한다는 뜻입니다. 이를 설계 접근성으로 부릅니다. 화면 기술 접근성(키보드, 스크린 리더, 대비 등)은 필요할 때 같은 기록의 후속 검증으로 연결하되, UX 의도와 혼동하지 않습니다. 사용할 때 다음 중 하나라도 추가하거나 변경하면 사용합니다. - 자동 실행, live upda

Key points:
• 자동 실행, live update, debounce, background feedback
• 새 control, 상태, 오류, reset, recovery 경로
• 버튼·설명·확인 단계처럼 기존 affordance를 제거하거나 축약하는 선택
• 사용자가 서로 다르게 해석할 수 있는 시각 상태
• 확인 단계를 줄이는 대신 발견 가능성이 낮아지는 UX 선택
• 다른 구현자가...