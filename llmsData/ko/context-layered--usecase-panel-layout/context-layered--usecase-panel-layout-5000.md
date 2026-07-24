---
document_id: context-layered--usecase-panel-layout
category: context-layered
source_path: ko/context-layered/usecase-panel-layout.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.457Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패널 레이아웃 Preference 컨벤션

패널 레이아웃 Preference 컨벤션 이 문서는 접기·펼치기와 크기 조절이 가능한 에디터 패널을 Context-Action 방식으로 관리하기 위한 스펙입니다. standalone Web Studio의 구현 기준이며 workspace나 tool protocol을 새로 정의하는 문서가 아닙니다. 리뷰 판정 현재 구현은 다음 feature 경계에서 컨벤션을 지킵니다. | 경계 | 구현 | 판정 | | --- | --- | --- | | Presentation state | hooks/use-panel-layout.ts | sidebar/preview 레이아웃 preference만 소유 | | Resize interaction | views/panel-resize-handle.tsx | delta만 전달하는 순수 interaction surface | | Preview 표현 | views/preview-panel.tsx | layout state와 callback을 props로 받음 | | 조합 | BoltStyleEditor.tsx | preference hook을 workbench grid에 연결 | | Tool/domain state | ToolContext, workspace manager, revision history | 의도적으로 패널 레이아웃과 분리 | 이 기능은 Tool Registry를 호출하지 않고, workspace 파일을 변경하지 않으며, workspace revision을 증가시키거나 approval/trace pipeline에 들어가지 않습니다. local presentation preference에 맞는 경계입니다. Presentation-only 소유권 standalone 데모는 실시간 preference 상태를 React useState를 사용하는 전용 hook으로 관리합니다. persistence는 기존 Dexie 기반 workspace repository가 작은 PanelLayoutPreferenceRepository port를 통해 제공하며, panel view-model이 IndexedDB를 직접 접근하지 않습니다. 이는 다음 조건을 만족하는 presentation-only 소유권 결정입니다. - 하나의 editor surface에만 국한됩니다. - tool, handler, business rule이 이 상태를 소비하지 않습니다. - 레이아웃 변경이 workspace mutation을 의미하지 않습니다. - persistence 실패가 editor 정확성을 훼손하지 않는 best-effort 상태입니다. - 저장 record는 workspace file과 revision에서 분리됩니다. 향후 여러 route가 이 preference를 공유하거나, 여러 surface가 관찰하거나, agent/tool이 조작해야 한다면 named Store Context와 facade로 승격해야 합니다. 현재 hook을 두 번째 domain state-management API로 확장해서는 안 됩니다. 계약 공개 preference 모델은 의도적으로 작게 유지합니다. 브라우저 persistence 계약은 workspace와 같은 Dexie database를 사용합니다. WebCodingWorkspaceRepository가 loadPanelLayout()과 savePanelLayout()으로 이 port를 구현하고, usePanelLayout이 범위를 보정합니다. 읽기/쓰기 실패는 기본값으로 돌아가는 best-effort fallback으로 처리합니다. 이후 shape를 깨뜨리는 변경은 preference schema version을 올리고 migration을 추가해야 하며, 기존 값을 조용히 재해석하지 않습니다. panel preference는 workspace file record, revision history, folder sync에 포함되지 않습니다. 소유권 규칙 usePanelLayout 이 hook은 레이아웃 preference를 위한 presentation view-model입니다. 다음만 담당합니다. - 저장된 preference 로드와 범위 보정; - sidebar와 preview rail 토글; - 범위가 제한된 width delta 적용; - workspace 상태와 분리된 preference 저장. 파일 mutation, tool 실행, approval 결정, preview revision acknowledgement, provider 설정은 소유하지 않습니다. PanelResizeHandle resize handle은 재사용 가능한 view primitive입니다. 일시적인 pointer interaction과 keyboard affordance만 담당합니다. - role="separator", aria-orientation="vertical"; - aria-valuemin, aria-valuemax, aria-valuenow; - pointer capture와 drag lifecycle; - 좌우 화살표 8 CSS px step. 어떤 패널을 조절하는지는 부모가 physical delta를 해석합니다. handle은 storage를 쓰거나 자신이 sidebar인지 preview인지 알아서는 안 됩니다. BoltStyleEditor와 PreviewPanel workbench가 조합을 소유합니다. CSS variable, collapse callback, 범위 제한 resize callback을 제공합니다. PreviewPanel은 접기 버튼과 resize handle을 표현할 수 있지만 레이아웃 preference를 스스로 발견하거나 변경하지 않습니다.

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
• panel width나 collapsed state를 workspace revision/file diff에 포함하지 않습니다.
• 문서화된 범위를 벗어난 임의의 CSS width를 사용하지 않습니다.
• 패널의 시각 상태로 approval이나 persistence 상태를 추론하지 않습니다.
• panel hook을 editor/tool state의 범용 store로 확장하지 않습니다.