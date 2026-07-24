---
document_id: guide--patterns--ref--basic-usage
category: guide
source_path: ko/guide/patterns/ref/basic-usage.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.382Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Ref 기본 사용법

Ref 기본 사용법 타입 안전 ref 관리와 리렌더링 없는 기본 RefContext 패턴입니다. 가져오기 기능 - ✅ DOM 조작 시 React 리렌더링 없음 - ✅ 하드웨어 가속 변환 - ✅ 타입 안전 ref 관리 - ✅ 자동 라이프사이클 관리 - ✅ 완벽한 관심사 분리 - ✅ 자동 정리를 통한 메모리 효율성 선행 요건 필수 읽기: RefContext 설정 가이드 이 문서는 표준화된 설정 패턴을 사용하여 사용 패턴을 보여줍니다: - 타입 정의 → DOM 요소 Refs - 컨텍스트 생성 → 기본 RefContext 설정 - 프로바이더 설정 → 단일 RefContext 프로바이더 - 초기화 패턴 → 지연 초기화 설정 패턴 기본 설정 프로바이더 통합 Ref 등록 기본 사용 예제 커스텀 훅 패턴 사용 가능한 훅 - useRefHandler(name) - 이름으로 타입화된 ref 핸들러 가져오기 - useWaitForRefs() - 여러 ref가 마운트되기까지 대기 - useGetAllRefs() - 모든 마운트된 ref 액세스 - refHandler.setRef - ref 콜백 설정 - refHandler.target - 현재 ref 값 액세스 - refHandler.isMounted - 마운트 상태 확인 - refHandler.waitForMount() - 비동기 ref 대기 - refHandler.withTarget() - 안전한 작업 실제 사례 코드베이스의 라이브 예제 - RefContext 마우스 이벤트 페이지 - RefContext를 사용한 완전한 마우스 추적 - 캔버스 데모 - 직접 DOM 조작을 사용한 캔버스 그리기 - 폼 빌더 데모 - ref를 사용한 동적 폼 빌더 - 요소 관리 페이지 - 복잡한 요소 관리 - 비주얼 이펙트 컨텍스트 - RefContext를 사용한 비주얼 이펙트 - 성능 컨텍스트 - ref를 사용한 성능 모니터링 모범 사례 1. 하드웨어 가속: GPU 가속 애니메이션을 위해 translate3d() 사용 2. React 리렌더링 방

Key points:
• ✅ DOM 조작 시 React 리렌더링 없음
• ✅ 하드웨어 가속 변환
• ✅ 타입 안전 ref 관리
• ✅ 자동 라이프사이클 관리
• ✅ 완벽한 관심사 분리
• ✅ 자동 정리를 통한 메모리 효율성
• **타입 정의** → [DOM 요소 Refs](../setup/ref-context-setup.md#dom-element-refs)
• **컨텍스트 생성** → [기본 RefContext 설정](../setup/ref-context-setup.md#basic-refcontext-setup)
• **프로바이더 설정** → [단일 RefContext 프로바이더](../setup/ref-context-setup.md#single-refcontext-provider)
• **초기화 패턴** → [지연 초기화](../setup/ref-context-setup.md#lazy-initialization)
• `useRefHandler(name)` - 이름으로 타입화된 ref 핸들러 가져오기
• `useWaitForRefs()` - 여러 ref가 마운트되기까지 대기
• `useGetAllRefs()` - 모든 마운트된 ref 액세스
• `refHandler.setRef` - ref 콜백 설정
• `refHandler.target` -...