# 라이브러리 사양

## Context-Action 프레임워크 기술 사양

### 핵심 패키지

#### @context-action/core
- **목적**: React 의존성 없는 핵심 액션 파이프라인 관리
- **주요 구성요소**: ActionRegister, PipelineController
- **대상 환경**: 모든 JavaScript 환경

#### @context-action/tool-protocol
- **목적**: framework-neutral action schema와 MCP/provider tool 계약
- **의존성**: root action-schema API를 위한 Zod 런타임 의존성
- **주요 구성요소**: `defineAction`, canonical tool call, provider adapter, approval queue, idempotency/provenance/observability 계약
- **대상 환경**: 브라우저, Node.js 및 기타 JavaScript 환경

#### @context-action/tool-durable-operations
- **목적**: 선택적인 durable mutation record와 외부 side-effect adapter
- **의존성**: driver-neutral core, integration 검증 시 host 소유 Redis/PostgreSQL client 선택 사용
- **주요 구성요소**: durable operation store, side-effect runner, HTTP/queue adapter, IndexedDB/Redis/PostgreSQL reference backend
- **대상 환경**: 브라우저, Node.js 및 server worker

#### @context-action/react
- **목적**: Context API 및 훅을 통한 React 통합
- **의존성**: React 18 또는 19, @context-action/core, @context-action/tool-protocol, 그리고 직접 선언된 @context-action/tool-durable-operations 타입 의존성. durable 실행은 런타임에서 opt-in
- **주요 기능**: 스토어 관리, 액션 컨텍스트, 훅

### API 인터페이스

#### 주요 패턴

1. **Action Only 패턴**: `createActionContext(contextName, config?)`
2. **Store Only 패턴**: `createStoreContext(contextName, initialStores)`

#### 핵심 훅

- `useActionDispatch()`: 액션 디스패치
- `useActionHandler()`: 액션 핸들러 등록
- `useStoreValue()`: 스토어 값 구독
- `useStoreSelector()`: 특정 스토어 필드 선택

### 성능 특성

- **핸들러 등록**: Map을 통한 O(1) 조회
- **스토어 업데이트**: React 상태 업데이트 배치 처리
- **메모리 사용**: 언마운트 시 자동 정리
- **번들 크기**: React 패키지 약 15KB gzipped

### TypeScript 통합

- strict 모드로 완전한 타입 안전성
- 스토어 및 액션에 대한 제네릭 타입 추론
- 컴파일 타임 페이로드 검증

### 호환성

- **React**: 18.0.0 또는 19.0.0
- **TypeScript**: 6.0.3
- **Node.js**: 24.11.0+
- **번들러**: Vite, Webpack, Rollup
