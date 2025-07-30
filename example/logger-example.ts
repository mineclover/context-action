import { ActionRegister, LogLevel, ConsoleLogger, OtelConsoleLogger, OtelContext } from '../packages/core/src';

// 액션 타입 정의
interface AppActions {
  increment: void;
  setCount: number | { count: number; _traceId?: string; _sessionId?: string };
  updateUser: { id: string; name: string };
}

// 1. 기본 사용법 (환경변수나 기본 ERROR 레벨 사용)
const actionRegister1 = new ActionRegister<AppActions>();

// 2. 로그 레벨 지정
const actionRegister2 = new ActionRegister<AppActions>({
  logLevel: LogLevel.DEBUG
});

// 3. 커스텀 로거 사용
class CustomLogger extends ConsoleLogger {
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[CUSTOM] ${message}`, ...args);
    }
  }
}

const customLogger = new CustomLogger(LogLevel.INFO);
const actionRegister3 = new ActionRegister<AppActions>({
  logger: customLogger
});

// 4. OTEL 로거 사용
const actionRegister4 = new ActionRegister<AppActions>({
  useOtel: true,
  logLevel: LogLevel.DEBUG,
  otelContext: {
    sessionId: 'session-123',
    traceId: 'trace-456'
  }
});

// 5. OTEL 로거 + payload에서 자동 감지
const actionRegister5 = new ActionRegister<AppActions>({
  useOtel: true,
  logLevel: LogLevel.DEBUG
});

// 핸들러 등록
actionRegister1.register('increment', () => {
  console.log('Incremented!');
});

actionRegister1.register('setCount', (count) => {
  console.log(`Count set to: ${count}`);
});

// OTEL 로거용 핸들러 등록
actionRegister4.register('setCount', (count) => {
  console.log(`OTEL Count set to: ${count}`);
});

actionRegister5.register('setCount', (count) => {
  console.log(`Auto OTEL Count set to: ${count}`);
});

// 액션 디스패치
async function runExample() {
  console.log('=== ActionRegister Logger Example ===\n');
  
  console.log('1. 기본 로거 (ERROR 레벨)');
  await actionRegister1.dispatch('increment');
  await actionRegister1.dispatch('setCount', 42);
  
  console.log('\n2. DEBUG 레벨 로거');
  await actionRegister2.dispatch('increment');
  await actionRegister2.dispatch('setCount', 100);
  
  console.log('\n3. 커스텀 로거');
  await actionRegister3.dispatch('increment');
  await actionRegister3.dispatch('setCount', 200);
  
  console.log('\n4. OTEL 로거 (고정 컨텍스트)');
  await actionRegister4.dispatch('increment');
  await actionRegister4.dispatch('setCount', 300);
  
  console.log('\n5. OTEL 로거 (payload 자동 감지)');
  await actionRegister5.dispatch('increment');
  await actionRegister5.dispatch('setCount', 400);
  await actionRegister5.dispatch('setCount', { 
    count: 500, 
    _traceId: 'auto-trace-789',
    _sessionId: 'auto-session-456'
  });
}

// 환경변수 설정 예시:
// LOG_LEVEL=DEBUG node logger-example.js
// ACTION_LOG_LEVEL=INFO node logger-example.js

runExample().catch(console.error); 