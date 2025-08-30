---
document_id: ko_guide_canvas-optimization
category: guide
source_path: ko/guide/patterns/ref/canvas-optimization.md
character_limit: 1000
last_update: '2025-08-30T10:45:56.836Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
캔버스 성능 최적화

캔버스 성능 최적화 60fps+ 상호작용을 위한 RefContext를 사용한 고성능 캔버스 패턴입니다. 선행 요건 필수 설정: 이러한 캔버스 최적화 패턴을 사용하기 전에 캔버스 타입으로 RefContext를 설정해야 합니다. 설정 참고: RefContext 설정 가이드 - 완전한 타입 정의와 프로바이더 설정 패턴을 위한 "캔버스 및 그래픽 Refs" 섹션을 참조하세요. 🎨 라이브 예제 → 캔버스 데모 체험 최적화된 캔버스 구현을 실제로 경험해보세요. 데모는 이 가이드에서 설명하는 모든 성능 패턴을 보여줍니다: - 그리기 도구에 대한 즉각적인 시각적 피드백 - 부드러운 상호작용을 위한 듀얼 캔버스 아키텍처   - 지연 없는 실시간 자유 그리기 - 모든 도구에서 60fps+ 성능 로컬 개발: http:/

Key points:
• 그리기 도구에 대한 즉각적인 시각적 피드백
• 부드러운 상호작용을 위한 듀얼 캔버스 아키텍처
• 지연 없는 실시간 자유 그리기
• 모든 도구에서 60fps+ 성능
• ⚡ **지연 없음**: <16ms 시각적 응답 시간
• 🎯 **60fps 성능**: 상호작용 중 프레임 드롭 없음