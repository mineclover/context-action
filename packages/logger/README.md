# @context-action/logger

Context-Action 프레임워크를 위한 로깅 유틸리티 패키지입니다.

## 설치

```bash
npm install @context-action/logger
# 또는
yarn add @context-action/logger
# 또는
pnpm add @context-action/logger
```

## 사용법

### 기본 사용법

```typescript
import { createLogger, LogLevel } from '@context-action/logger';

// 기본 로거 생성
const logger = createLogger();

// 로그 레벨 설정
logger.setLevel(LogLevel.DEBUG);

// 로그 출력
logger.info('애플리케이션이 시작되었습니다');
logger.debug('디버그 정보', { userId: 123, action: 'login' });
logger.error('오류가 발생했습니다', new Error('Something went wrong'));
```

### 환경 변수 설정

`.env` 파일을 사용하여 로그 레벨을 설정할 수 있습니다:

```env
# 로그 레벨 설정
CONTEXT_ACTION_LOG_LEVEL=DEBUG

# 또는 간단한 플래그 사용
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_TRACE=true

# 로거 이름 설정
CONTEXT_ACTION_LOGGER_NAME=MyApp
```

### 로거 구현체

#### ConsoleLogger
기본 콘솔 기반 로거입니다.

```typescript
import { ConsoleLogger, LogLevel } from '@context-action/logger';

const logger = new ConsoleLogger(LogLevel.INFO);
logger.info('정보 메시지');
```

#### NoopLogger
모든 로그를 무시하는 로거입니다.

```typescript
import { NoopLogger } from '@context-action/logger';

const logger = new NoopLogger();
logger.info('이 메시지는 출력되지 않습니다'); // 아무것도 출력되지 않음
```

### 환경 변수 함수들

```typescript
import { 
  getLogLevelFromEnv, 
  getLoggerNameFromEnv, 
  getDebugFromEnv 
} from '@context-action/logger';

// 환경 변수에서 로그 레벨 가져오기
const logLevel = getLogLevelFromEnv();

// 환경 변수에서 로거 이름 가져오기
const loggerName = getLoggerNameFromEnv();

// 환경 변수에서 디버그 플래그 가져오기
const isDebug = getDebugFromEnv();
```

## API 참조

### LogLevel

```typescript
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}
```

### Logger 인터페이스

```typescript
interface Logger {
  trace(message: string, data?: any): void;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}
```

### 함수들

- `createLogger(level?: LogLevel): Logger` - 로거 인스턴스 생성
- `getLogLevelFromEnv(): LogLevel` - 환경 변수에서 로그 레벨 가져오기
- `getLoggerNameFromEnv(): string` - 환경 변수에서 로거 이름 가져오기
- `getDebugFromEnv(): boolean` - 환경 변수에서 디버그 플래그 가져오기

## 브라우저 지원

이 패키지는 Node.js와 브라우저 환경 모두에서 작동합니다:

- **Node.js**: `process.env` 사용
- **브라우저 (Vite)**: `import.meta.env` 사용

## 라이선스

Apache-2.0 