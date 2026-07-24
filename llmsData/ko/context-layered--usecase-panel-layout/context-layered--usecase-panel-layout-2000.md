---
document_id: context-layered--usecase-panel-layout
category: context-layered
source_path: ko/context-layered/usecase-panel-layout.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.457Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패널 레이아웃 Preference 컨벤션

패널 레이아웃 Preference 컨벤션 이 문서는 접기·펼치기와 크기 조절이 가능한 에디터 패널을 Context-Action 방식으로 관리하기 위한 스펙입니다. standalone Web Studio의 구현 기준이며 workspace나 tool protocol을 새로 정의하는 문서가 아닙니다. 리뷰 판정 현재 구현은 다음 feature 경계에서 컨벤션을 지킵니다. | 경계 | 구현 | 판정 | | --- | --- | --- | | Presentation state | hooks/use-panel-layout.ts | sidebar/preview 레이아웃 preference만 소유 | | Resize interaction | views/panel-resize-handle.tsx | delta만 전달하는 순수 interaction surface | | Preview 표현 | views/preview-panel.tsx | layout state와 callback을 props로 받음 | | 조합 | BoltStyleEditor.tsx | preference hook을 workbench grid에 연결 | | Tool/domain state | ToolContext, workspace manager, revision history | 의도적으로 패널 레이아웃과 분리 | 이 기능은 Tool Registry를 호출하지 않고, workspace 파일을 변경하지 않으며, workspace revision을 증가시키거나 approval/trace pipeline에 들어가지 않습니다. local presentation preference에 맞는 경계입니다. Presentation-only 소유권 standalone 데모는 실시간 preference 상태를 React useState를 사용하는 전용 hook으로 관리합니다. persistence는 기존 Dexie 기반 workspace repository가 작은 PanelLayoutPreferenceRep

Key points:
• 하나의 editor surface에만 국한됩니다.
• tool, handler, business rule이 이 상태를 소비하지 않습니다.
• 레이아웃 변경이 workspace mutation을 의미하지 않습니다.
• persistence 실패가 editor 정확성을 훼손하지 않는 best-effort 상태입니다.
• 저장 record는 workspace file과 revision에서 분리됩니다.
• 저장된 preference 로드와 범위 보정;
• sidebar와 preview rail 토글;
• 범위가 제한된 width delta 적용;
• workspace 상태와 분리된 preference 저장.
• `role="separator"`, `aria-orientation="vertical"`;
• `aria-valuemin`, `aria-valuemax`, `aria-valuenow`;
• pointer capture와 drag lifecycle;
• 좌우 화살표 8 CSS px step.
• view primitive에 `localStorage`, Dexie, repository, `workspace`, registry
• panel width나 collapsed state를...