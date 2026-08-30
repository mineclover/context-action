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

#### @context-action/ai-sdk
- **목적**: canonical tool manager를 scoped model ToolSet으로 바꾸는 선택적 AI SDK v7 adapter
- **의존성**: `@context-action/tool-protocol` runtime dependency와 필수 `ai` peer. React, core, provider, credential 의존성 없음
- **주요 구성요소**: `createAISDKToolScope`, native approval mapping, tool-call idempotency correlation, structured error mode
- **대상 환경**: AI SDK model client를 소유하는 browser 또는 server application

#### @context-action/webmcp
- **목적**: 실험적 WebMCP imperative API를 통해 명시적인 canonical 도구 scope를 노출하는 선택적 browser adapter
- **의존성**: `@context-action/tool-protocol`; React 또는 model provider 의존성 없음
- **주요 구성요소**: `createWebMCPToolScope`, 명시적 tool-name allowlist, WebMCP call ID/idempotency correlation, model/agent provenance, abort 기반 등록 해제
- **대상 환경**: `document.modelContext`를 제공하는 표시 가능하고 cross-origin isolation이 적용된 browser 또는 webview document

#### @context-action/react
- **목적**: Context API 및 훅을 통한 React 통합
- **의존성**: React 19.2+(peer), `@context-action/core`, `@context-action/mutative`, `@context-action/tool-protocol`, `@context-action/webmcp`. 배포된 React 3 artifact는 Durable Operations에 의존하지 않음
- **주요 기능**: 스토어 관리, 액션 컨텍스트, Compiler 최적화 훅, Activity 안전 Provider lifecycle, React 19.2 SSR 지원. Store·Action API는 `@context-action/react`에서 import함

### 릴리스 및 보안 기준

- **워크스페이스 패키지 기준 버전**: `@context-action/core` 1.1.2, `@context-action/react` 3.0.0, `@context-action/tool-protocol` 1.0.2, `@context-action/tool-durable-operations` 0.2.0, `@context-action/ai-sdk` 0.1.0, `@context-action/webmcp` 0.1.2. 외부 설치에는 published dist-tag를 기준으로 사용합니다.
- **런타임 기준**: Node.js `>=24.11.0`, pnpm `>=10.30.0`, TypeScript `6.0.3`
- **의존성 보안**: `pnpm security:audit`를 필수 OSV 검사로 사용하며 현재 actionable 취약점은 0건이다. 해결된 의존성 최소 버전은 루트 `pnpm.overrides`에서 강제한다.
- **임시 예외**: `GHSA-qwww-vcr4-c8h2`에 대해 `react-router@7.18.1`을 기간 한정 예외로 유지한다. 예제는 browser routing만 사용하고 `react-router-dom` 8.3.0은 아직 공개되지 않았으므로 2026-09-30 전에 재검토한다.
- **검증 기준**: 의존성 변경은 `pnpm security:audit`, `pnpm type-check`, `pnpm test`, `pnpm docs:build`, 예제 `check`/`build`를 통과해야 한다.

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
- **번들 크기**: 빌드와 압축기에 따라 달라지며, 현재 `pnpm --filter @context-action/react bundle-report` 기준 기본 React ESM 엔트리는 gzip 13.46 kB

### TypeScript 통합

- strict 모드로 완전한 타입 안전성
- 스토어 및 액션에 대한 제네릭 타입 추론
- 컴파일 타임 페이로드 검증
- 페이로드 액션은 페이로드가 필수이고 `void` 액션은 생략할 수 있음
- `DispatchOptions`는 dispatch 및 결과 dispatch의 선택적 두 번째 인자
- `ExecutionResult`는 실제 파이프라인 실행 결과에서 실행·건너뜀·실패 핸들러 수를 집계

### 호환성

- **React**: 19.2.0 이상
- **TypeScript**: 6.0.3
- **Node.js**: 24.11.0+
- **번들러**: Vite, Webpack, Rollup
