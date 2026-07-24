---
document_id: concept--notifyPath-performance-proof
category: concept
source_path: ko/concept/notifyPath-performance-proof.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.498Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
notifyPath/notifyPaths 성능 증명

notifyPath/notifyPaths 성능 증명 이 문서는 Store 컨벤션의 성능 주장에 대한 수학적이고 논리적인 증명을 제공합니다. 📊 주장된 성능 개선 1. 50% 재렌더링 감소: 2번 렌더 → 1번 렌더 2. RAF 배칭 효율: N번 호출 → 1번 RAF 프레임 3. 선택적 재렌더링: 영향받은 경로만 업데이트 4. 제로 비용 알림: 상태 변경 없는 notifyPath --- 1. 재렌더링 감소 증명 (50%) 전통적 접근 (setValue) 분석: - 재렌더링: 2번 (로딩 + 데이터) - 상태 변경: 2번 (setValue × 2) - React 업데이트: 2번 (전체 컴포넌트 트리) 최적화된 접근 (notifyPath) 분석: - 재렌더링: 1번 (최종 데이터만) - 상태 변경: 1번 (setValue × 1) - React 업데이트: 1번 (최종 상태) - 알림: 1번 (notifyPath - 제로 비용) 수학적 증명 ✅ 증명됨: React 재렌더링 50% 감소 --- 2. RAF 배칭 효율 증명 배칭 없이 (가상) RAF 배칭 사용 (실제 구현) 수학적 증명 ✅ 증명됨: 배칭으로 선형 개선 (N배) notifyPaths 배치 API ✅ 증명됨: notifyPaths로 결정적 배칭 --- 3. 선택적 재렌더링 증명 시나리오: 큰 상태 트리 전통적 구독 (useStoreValue) 문제: - 사용자 이름 변경 → Sidebar + DataGrid 재렌더링 (불필요) - Sidebar 변경 → UserName + DataGrid 재렌더링 (불필요) - 낭비된 재렌더링: 66% (2/3 컴포넌트 불필요) 경로 기반 구독 (useStorePath + notifyPath) 분석: - 사용자 이름 변경 → 1번 재렌더링 (UserName만) - Sidebar 변경 → 1번 재렌더링 (Sidebar만) - 낭비된 재렌더링: 0% (100% 효율) 수학적 증명 ✅ 증명됨: 불필요한 재렌더링 제거 (3배 효율) --- 4. 제로 비용 알림 증명

Key points:
• **재렌더링**: 2번 (로딩 + 데이터)
• **상태 변경**: 2번 (setValue × 2)
• **React 업데이트**: 2번 (전체 컴포넌트 트리)
• **재렌더링**: 1번 (최종 데이터만)
• **상태 변경**: 1번 (setValue × 1)
• **React 업데이트**: 1번 (최종 상태)
• **알림**: 1번 (notifyPath - 제로 비용)
• 사용자 이름 변경 → Sidebar + DataGrid 재렌더링 (불필요)
• Sidebar 변경 → UserName + DataGrid 재렌더링 (불필요)
• **낭비된 재렌더링**: 66% (2/3 컴포넌트 불필요)
• 사용자 이름 변경 → 1번 재렌더링 (UserName만)
• Sidebar 변경 → 1번 재렌더링 (Sidebar만)
• **낭비된 재렌더링**: 0% (100% 효율)
• 컴포넌트: 3개
• 영향받는 경로: 1개
• 재렌더링: 3번 (전체 트리)