---
document_id: ko_guide_wait-then-execute
category: guide
source_path: ko/guide/patterns/async/wait-then-execute.md
character_limit: 5000
last_update: '2025-08-30T10:45:57.303Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
대기-후-실행 패턴

대기-후-실행 패턴 엘리먼트 가용성을 확보한 후 안전하게 DOM 조작을 실행하는 패턴입니다. 전제 조건 필수 설정: 타입 정의, DOM 엘리먼트 ref, 그리고 프로바이더 구성을 포함한 완전한 RefContext 설정 지침은 RefContext 설정을 참조하세요. 이 패턴은 다음 설정 패턴을 사용하여 DOM 대기 전략을 보여줍니다: - 타입 정의 → DOM 엘리먼트 Ref - 컨텍스트 생성 → 기본 RefContext 설정 - 프로바이더 설정 → 프로바이더 설정 패턴 - 고급 사용법 → 여러 Ref 대기 Store와 Action 통합에 대해서는 다음을 참조하세요: - 기본 Store 설정 - 상태 관리를 위한 Store 컨텍스트 - 기본 Action 설정 - 비즈니스 로직을 위한 Action 컨텍스트 기본 패턴 고급 예제 Store 통합 패턴 Action Handler 통합 다중 엘리먼트 조정 순차적 작업 모범 사례 1. 엘리먼트 항상 확인: 대기 후 엘리먼트 존재 여부를 확인합니다 (RefContext 설정 패턴 준수) 2. Store 통합: DOM 조작 결과를 반영하기 위해 store를 업데이트합니다 3. 에러 처리: try-catch 블록과 store 에러 상태를 구현합니다 4. 성능: 하드웨어 가속 속성을 사용하고 store 업데이트를 배치 처리합니다 5. 정리: RefContext 생명주기 관리에 의한 적절한 정리 6. 타입 안전성: 모든 ref에 대해 설정 가이드 타입 정의를 사용합니다 설정 통합 예제 Store 업데이트를 포함한 폼 검증 진행 상황 추적을 포함한 캔버스 렌더링 일반적인 사용 사례 - 폼 검증: 폼 엘리먼트 대기 + store에 검증 상태 저장 - 애니메이션 시퀀스: 애니메이션 조정 + store에서 애니메이션 진행 상황 추적   - 데이터 시각화: 캔버스/SVG 대기 + store에 렌더링 상태 및 데이터 저장 - 모달 조작: 모달이 마운트되었는지 확인 + store에서 모달 상태 관리 - 드래그 앤 드롭: 드롭 영역 대기 + 드래그 조작 상태 추적 관련 패턴 - RefContext 설정 - 완전한 대기 패턴 - 캔버스 최적화 - 고성능 캔버스 조작 - Store 통합 패턴 - DOM 조작 후 Store 업데이트

Key points:
• **타입 정의** → [DOM 엘리먼트 Ref](../setup/ref-context-setup.md#dom-element-refs)
• **컨텍스트 생성** → [기본 RefContext 설정](../setup/ref-context-setup.md#basic-refcontext-setup)
• **프로바이더 설정** → [프로바이더 설정 패턴](../setup/ref-context-setup.md#provider-setup-patterns)
• **고급 사용법** → [여러 Ref 대기](../setup/ref-context-setup.md#waiting-for-multiple-refs)
• **[기본 Store 설정](../setup/basic-store-setup.md)** - 상태 관리를 위한 Store 컨텍스트
• **[기본 Action 설정](../setup/basic-action-setup.md)** - 비즈니스 로직을 위한 Action 컨텍스트
• **폼 검증**: 폼 엘리먼트 대기 + store에 검증 상태 저장
• **애니메이션 시퀀스**: 애니메이션 조정 + store에서 애니메이션 진행 상황 추적
• **데이터 시각화**: 캔버스/SVG 대기 + store에 렌더링 상태 및 데이터 저장
• **모달 조작**: 모달이 마운트되었는지 확인 + store에서 모달 상태 관리
• **드래그 앤 드롭**: 드롭 영역 대기 + 드래그 조작 상태 추적
• **[RefContext 설정](../setup/ref-context-setup.md#waiting-for-multiple-refs)** - 완전한 대기 패턴
• **[캔버스 최적화](../ref/canvas-optimization.md)** - 고성능 캔버스 조작
• **[Store 통합 패턴](../store/basic-usage.md)** - DOM 조작 후 Store 업데이트
• **엘리먼트 항상 확인**: 대기 후 엘리먼트 존재 여부를 확인합니다 (RefContext 설정 패턴 준수)
• **Store 통합**: DOM 조작 결과를 반영하기 위해 store를 업데이트합니다
• **에러 처리**: try-catch 블록과 store 에러 상태를 구현합니다
• **성능**: 하드웨어 가속 속성을 사용하고 store 업데이트를 배치 처리합니다
• **정리**: RefContext 생명주기 관리에 의한 적절한 정리
• **타입 안전성**: 모든 ref에 대해 설정 가이드 타입 정의를 사용합니다