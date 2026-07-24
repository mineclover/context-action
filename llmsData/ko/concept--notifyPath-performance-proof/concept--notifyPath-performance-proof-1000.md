---
document_id: concept--notifyPath-performance-proof
category: concept
source_path: ko/concept/notifyPath-performance-proof.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.498Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
notifyPath/notifyPaths 성능 증명

notifyPath/notifyPaths 성능 증명 이 문서는 Store 컨벤션의 성능 주장에 대한 수학적이고 논리적인 증명을 제공합니다. 📊 주장된 성능 개선 1. 50% 재렌더링 감소: 2번 렌더 → 1번 렌더 2. RAF 배칭 효율: N번 호출 → 1번 RAF 프레임 3. 선택적 재렌더링: 영향받은 경로만 업데이트 4. 제로 비용 알림: 상태 변경 없는 notifyPath --- 1. 재렌더링 감소 증명 (50%) 전통적 접근 (setValue) 분석: - 재렌더링: 2번 (로딩 + 데이터) - 상태 변경: 2번 (setValue × 2) - React 업데이트: 2번 (전체 컴포넌트 트리) 최적화된 접근 (notifyPath) 분석: - 재렌더링: 1번 (최종 데이터만) - 상태 변경

Key points:
• **재렌더링**: 2번 (로딩 + 데이터)
• **상태 변경**: 2번 (setValue × 2)
• **React 업데이트**: 2번 (전체 컴포넌트 트리)
• **재렌더링**: 1번 (최종 데이터만)
• **상태 변경**: 1번 (setValue × 1)
• **React 업데이트**: 1번 (최종 상태)