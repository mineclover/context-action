---
document_id: guide--optimization-techniques
category: guide
source_path: ko/guide/patterns/performance/optimization-techniques.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.367Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
성능 최적화 기법

Context-Action 프레임워크를 위한 포괄적인 성능 최적화 패턴 및 기법입니다. 전제 조건

이러한 최적화에서 사용되는 설정 패턴에 대해서는 다음을 참조하세요:
- 기본 Store 설정 - Store 성능 구성
- 기본 Action 설정 - Action 최적화 패턴
- RefContext 설정 - DOM 성능 최적화
- Provider 구성 설정 - Provider 최적화

📋 목차

1. Store 최적화
2. Action 최적화
3. 메모이제이션 패턴
4. RefContext 성능

---

Store 최적화

🔄 비교 전략 선택

데이터 특성에 따라 적절한 비교 전략을 선택하세요:

📊 Store 구독 최적화

---

Action 최적화

⚡ 핸들러 메모이제이션

🎯 디바운스/스로틀 구성

---

메모이제이션 패턴

🔄 컴포넌트 메모이제이션

⚡ 콜백 메모이제이션

---

RefContext 성능

⚡ 제로 재렌더링 DOM 조작

🎨 애니메이션 성능

---

📊 성능 측정

🔍 성능 모니터링

---

📚 관련 패턴

- RefContext 성능 - 상세한 RefContext 최적화
- 하드웨어 가속 - GPU 가속 기법
- 메모리 최적화 - 메모리 관리 패턴

---

💡 성능 팁

1. 데이터 패턴에 따라 적절한 store 비교 전략을 선택하세요
2. 전략적으로 메모이제이션 사용 - 모든 곳에 사용하지 마세요
3. 성능이 중요한 작업에는 RefContext를 활용하세요
4. 측정 유틸리티로 성능을 모니터링하세요
5. 애니메이션에 하드웨어 가속을 사용하세요
6. 메모리 누수를 방지하기 위해 리소스를 적절히 정리하세요.
