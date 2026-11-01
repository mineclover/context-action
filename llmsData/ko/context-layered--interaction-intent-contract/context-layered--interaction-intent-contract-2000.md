---
document_id: context-layered--interaction-intent-contract
category: context-layered
source_path: ko/context-layered/interaction-intent-contract.md
character_limit: 2000
last_update: '2026-11-01T11:30:48.925Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
상호작용 의도 계약(IIC) 컨벤션

상호작용 의도 계약(IIC) 컨벤션 상태: Active 최근 검토: 2026-11-01 범위: interactive example, 공개 UI, 데모, workflow view 이 컨벤션에서 말하는 접근성은 스크린 리더 대응만을 뜻하지 않습니다. 디자인을 만든 사람이 아니어도 왜 버튼이나 설명을 줄였는지, 어떤 직관적 반응을 약속했는지, 그 선택을 어떻게 되돌리고 검증하는지 다시 이해할 수 있어야 한다는 뜻입니다. 이를 설계 접근성으로 부릅니다. 화면 기술 접근성(키보드, 스크린 리더, 대비 등)은 필요할 때 같은 기록의 후속 검증으로 연결하되, UX 의도와 혼동하지 않습니다. 사용할 때 다음 중 하나라도 추가하거나 변경하면 사용합니다. - 자동 실행, live update, debounce, background feedback - 새 control, 상태, 오류, reset, recovery 경로 - 버튼·설명·확인 단계처럼 기존 affordance를 제거하거나 축약하는 선택 - 사용자가 서로 다르게 해석할 수 있는 시각 상태 - 확인 단계를 줄이는 대신 발견 가능성이 낮아지는 UX 선택 단순한 시각 변경은 별도 기록이 없어도 되지만, 소유 specification이나 PR에 영향을 받는 설계 의도와 기술 접근성 불변 조건은 남깁니다. 문서 부담을 조절하기 위해 영향도를 나눕니다. - Lite IIC: 로컬·가역적이고 외부 저장이나 비용 있는 effect가 없는 변경 - Full IIC: 자동 실행, 비동기·비용 있는 작업, persistence, 외부 effect, 파괴적 동작, 또는 복구·rollback이 필요한 변경 Full IIC는 pending, failure, cancel, rollback 기준까지 기록합니다. 암묵적 합의 기록 암묵적 합의는 구현을 읽지 않아도 사용자가 예상해야 하는 동작입니다. 예를 들어 “checkbox를 바꾸면 실험이 실행된다”, “최신 결과가 기준이다”, “reset은 재현 가능한 실패

Key points:
• 자동 실행, live update, debounce, background feedback
• 새 control, 상태, 오류, reset, recovery 경로
• 버튼·설명·확인 단계처럼 기존 affordance를 제거하거나 축약하는 선택
• 사용자가 서로 다르게 해석할 수 있는 시각 상태
• 확인 단계를 줄이는 대신 발견 가능성이 낮아지는 UX 선택
• **Lite IIC:** 로컬·가역적이고 외부 저장이나 비용 있는 effect가 없는 변경
• **Full IIC:** 자동 실행, 비동기·비용 있는 작업, persistence, 외부 effect,
• 다른 구현자가 재현해야 하는 핵심 논리:
• 문서·UI·테스트에서 유지해야 하는 문장:
• semantic control과 accessible name:
• keyboard와 비포인터 경로:
• focus 동작:
• 상태/값/오류 알림:
• 색상·모션·대비·텍스트 대체:
• UX 이점:
• 접근성 위험: