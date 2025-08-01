# Example App Trace Logging

이 예제 앱에서 Context-Action Core의 trace 로깅을 확인하는 방법입니다.

## 🚀 시작하기

### 1. 개발 서버 실행

```bash
cd /Users/junwoobang/project/context-action/example
pnpm dev
```

### 2. 브라우저에서 확인

1. **브라우저에서 http://localhost:4000 접속**
2. **개발자 도구 열기** (F12 또는 Cmd+Option+I)
3. **Console 탭으로 이동**
4. **Core Basics 페이지로 이동**: http://localhost:4000/core/basics

### 3. Trace 로깅 확인

Core Basics 페이지에서 버튼들을 클릭해보세요:
- **+1 버튼** - increment 액션 실행
- **-1 버튼** - decrement 액션 실행  
- **Set to 10 버튼** - setCount 액션 실행
- **Random 버튼** - 랜덤 값으로 setCount 실행
- **Reset 버튼** - reset 액션 실행
- **Add Custom Log 버튼** - log 액션 실행

## 🔍 예상 출력

버튼을 클릭하면 개발자 도구 Console에서 다음과 같은 상세한 trace 로그를 볼 수 있습니다:

```
[TRACE] ExampleApp constructor called { config: {} }
[INFO] ExampleApp initialized { logLevel: 0, debug: true }
[TRACE] ExampleApp constructor completed 
[TRACE] Registering handler for action 'increment' { config: {} }
[TRACE] Generated handler ID: handler_1 
[TRACE] Created handler registration { registration: { id: 'handler_1', config: { ... } } }
[TRACE] Creating new pipeline for action: increment 
[DEBUG] Created pipeline for action: increment 
...
[TRACE] Starting dispatch for action 'increment' { action: 'increment', payload: undefined, startTime: ... }
[TRACE] Emitted 'action:start' event 
[DEBUG] Dispatching action 'increment' { payload: undefined }
[TRACE] Found 1 handlers for action 'increment' { handlerIds: ['handler_1'] }
[TRACE] Starting pipeline execution { action: 'increment', handlerCount: 1, payload: undefined }
[TRACE] Executing handler 1/1 { handlerId: 'handler_1', priority: 0, blocking: false, once: false }
[TRACE] Calling handler 'handler_1' 
[TRACE] Handler 'handler_1' returned { isPromise: false, blocking: false }
[TRACE] Handler 'handler_1' completed successfully 
[DEBUG] Completed action 'increment' { action: 'increment', executionTime: 0, handlerCount: 1, success: true, timestamp: ... }
```

## ⚙️ 환경 변수 설정

현재 `.env` 파일에 설정된 내용:

```bash
# Maximum detail logging for browser environment
VITE_CONTEXT_ACTION_TRACE=true
VITE_CONTEXT_ACTION_DEBUG=true  
VITE_CONTEXT_ACTION_LOG_LEVEL=TRACE
VITE_CONTEXT_ACTION_LOGGER_NAME=ExampleApp
VITE_NODE_ENV=development
```

## 🔧 로깅 레벨 조정

로깅 양을 조정하려면 `.env` 파일을 수정하세요:

```bash
# 에러만 보기
VITE_CONTEXT_ACTION_LOG_LEVEL=ERROR

# 디버그 정보만 보기  
VITE_CONTEXT_ACTION_LOG_LEVEL=DEBUG

# 모든 trace 정보 보기 (기본값)
VITE_CONTEXT_ACTION_LOG_LEVEL=TRACE
```

수정 후 개발 서버를 재시작하세요.

## 🛠️ 문제 해결

### 로그가 안 보이는 경우

1. **개발자 도구 Console 확인**: F12 → Console 탭
2. **로그 레벨 확인**: All 또는 Verbose로 설정
3. **캐시 무효화**: Ctrl+F5 또는 Cmd+Shift+R로 새로고침
4. **환경 변수 확인**: .env 파일이 올바르게 설정되었는지 확인

### 너무 많은 로그가 나오는 경우

```bash
# .env 파일에서 로그 레벨 조정
VITE_CONTEXT_ACTION_LOG_LEVEL=INFO
```

## 🎯 테스트할 페이지들

- **Core Basics**: `/core/basics` - 기본 액션 디스패치
- **Core Advanced**: `/core/advanced` - 고급 기능들
- **Core Performance**: `/core/performance` - 성능 테스트
- **Core Integration**: `/core/integration` - 통합 예제

각 페이지에서 다양한 액션들을 실행해보며 trace 로깅을 확인해보세요!