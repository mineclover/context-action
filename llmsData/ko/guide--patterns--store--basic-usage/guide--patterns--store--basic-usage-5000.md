---
document_id: guide--patterns--store--basic-usage
category: guide
source_path: ko/guide/patterns/store/basic-usage.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.411Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스토어 기본 사용법

스토어 기본 사용법 뛰어난 타입 추론과 간단한 API를 제공하는 기본 스토어 전용 패턴. 가져오기 주요 기능 - ✅ 수동 타입 어노테이션 없이 뛰어난 타입 추론 - ✅ 스토어 관리에 집중된 간단한 API - ✅ 직접 값 또는 설정 객체 지원 - ✅ 별도의 createStore 호출 불필요 사전 요구사항 스토어 정의, 컨텍스트 생성, 프로바이더 설정을 포함한 완전한 설정 지침은 기본 스토어 설정 을 참조하세요. 이 문서는 스토어 설정을 사용한 사용 패턴을 보여줍니다: - 스토어 정의 → 타입 추론 설정 - 컨텍스트 생성 → 단일 도메인 스토어 컨텍스트 - 프로바이더 설정 → 단일 프로바이더 설정 사용 패턴 기본 스토어 접근 패턴 명시적 제네릭 타입 패턴 프로바이더 설정 컴포넌트 사용법 사용 가능한 훅 - useUserStore(name) - 이름으로 타입이 지정된 사용자 도메인 스토어 가져오기 (주요 API) - useUserStoreManager() - 사용자 스토어 매니저 접근 (고급 사용) - useStoreInfo() - 레지스트리 정보 가져오기 (설정 컨텍스트에서) - useStoreClear() - 모든 스토어 지우기 (설정 컨텍스트에서) 실제 예제 코드베이스의 라이브 예제 - 할 일 목록 데모 - 필터링 및 정렬이 있는 완전한 CRUD - 채팅 데모 - 실시간 메시지 상태 관리 - 사용자 프로필 데모 - 프로필 데이터 관리 - 스토어 기본 페이지 - 기본 스토어 작업 - React 프로바이더 페이지 - 프로바이더 구성 패턴 - 스토어 시나리오 인덱스 - 중앙 스토어 설정 모범 사례 1. 타입 추론 사용: TypeScript가 자동으로 타입을 추론하도록 하기 2. 직접 값: 간단한 타입에는 직접 값 사용 3. 설정 객체: 복잡한 타입에는 설정 객체 사용 4. 도메인 명명: 컨텍스트에 설명적인 도메인 이름 사용 5. 구독 관리: 불필요한 재렌더링 방지를 위해 실제로 필요한 스토어만 구독

Key points:
• ✅ 수동 타입 어노테이션 없이 뛰어난 타입 추론
• ✅ 스토어 관리에 집중된 간단한 API
• ✅ 직접 값 또는 설정 객체 지원
• ✅ 별도의 `createStore` 호출 불필요
• 스토어 정의 → [타입 추론 설정](../setup/basic-store-setup.md#type-inference-configurations)
• 컨텍스트 생성 → [단일 도메인 스토어 컨텍스트](../setup/basic-store-setup.md#single-domain-store-context)
• 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-store-setup.md#single-provider-setup)
• `useUserStore(name)` - 이름으로 타입이 지정된 사용자 도메인 스토어 가져오기 (주요 API)
• `useUserStoreManager()` - 사용자 스토어 매니저 접근 (고급 사용)
• `useStoreInfo()` - 레지스트리 정보 가져오기 (설정 컨텍스트에서)
• `useStoreClear()` - 모든 스토어 지우기 (설정 컨텍스트에서)
• **[할 일 목록 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx)** - 필터링 및 정렬이 있는 완전한 CRUD
• **[채팅 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx)** - 실시간 메시지 상태 관리
• **[사용자 프로필 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)** - 프로필 데이터 관리
• **[스토어 기본 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/store/StoreBasicsPage.tsx)** - 기본 스토어 작업
• **[React 프로바이더 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/react/ReactProviderPage.tsx)** - 프로바이더 구성 패턴
• **[스토어 시나리오 인덱스](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/stores/index.ts)** - 중앙 스토어 설정
• **타입 추론 사용**: TypeScript가 자동으로 타입을 추론하도록 하기
• **직접 값**: 간단한 타입에는 직접 값 사용
• **설정 객체**: 복잡한 타입에는 설정 객체 사용
• **도메인 명명**: 컨텍스트에 설명적인 도메인 이름 사용
• **구독 관리**: 불필요한 재렌더링 방지를 위해 실제로 필요한 스토어만 구독