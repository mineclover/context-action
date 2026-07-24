---
document_id: guide--react-context-migration
category: guide
source_path: ko/guide/react-context-migration.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.432Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Context에서 Context-Action으로 마이그레이션 가이드

React Context에서 Context-Action으로 마이그레이션 가이드 이 가이드는 기존 React Context 패턴에서 Context-Action으로 마이그레이션하는 방법을 설명합니다. 일반적인 패턴들과 Context-Action에서의 대응 방법, 그리고 다른 접근이 필요한 패턴들을 다룹니다. 개요 Context-Action은 기본 React Context에 비해 더 구조화된 상태 관리 접근 방식을 제공합니다. 대부분의 패턴은 직접 변환이 가능하지만, 일부는 프레임워크의 관심사 분리 철학으로 인해 아키텍처 조정이 필요합니다. 주요 차이점 | 관점 | React Context | Context-Action | |------|---------------|----------------| | 상태 + 로직

Key points:
• `setValue(value)` - 직접 교체 (이전 값 접근 불가)
• `update(prev => newValue)` - 이전 값 접근이 가능한 함수형 업데이트
• 하나의 API에서 두 패턴이 모두 필요하면 래퍼 함수 생성
• [ ] 앱의 모든 Context provider 파악
• [ ] 크로스 컨텍스트 의존성 매핑
• [ ] provider의 모든 사이드...