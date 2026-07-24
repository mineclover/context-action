---
document_id: context-layered--usecase-panel-layout
category: context-layered
source_path: ko/context-layered/usecase-panel-layout.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.457Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패널 레이아웃 Preference 컨벤션

패널 레이아웃 Preference 컨벤션 이 문서는 접기·펼치기와 크기 조절이 가능한 에디터 패널을 Context-Action 방식으로 관리하기 위한 스펙입니다. standalone Web Studio의 구현 기준이며 workspace나 tool protocol을 새로 정의하는 문서가 아닙니다. 리뷰 판정 현재 구현은 다음 feature 경계에서 컨벤션을 지킵니다. | 경계 | 구현 | 판정 | | --- | --- | --- | | Presentation state | hooks/use-panel-layout.ts | sidebar/preview 레이아웃 preference만 소유 | | Resize interaction | views/panel-resize-handle.tsx |

Key points:
• 하나의 editor surface에만 국한됩니다.
• tool, handler, business rule이 이 상태를 소비하지 않습니다.
• 레이아웃 변경이 workspace mutation을 의미하지 않습니다.
• persistence 실패가 editor 정확성을 훼손하지 않는 best-effort 상태입니다.
• 저장 record는 workspace file과 revision에서...