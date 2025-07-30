import { ActionRegister, LogLevel, ConsoleLogger, OtelConsoleLogger, OtelContext } from '../packages/core/src';

// 액션 타입 정의
interface AppActions {
  increment: void;
  setCount: number | { count: number; _traceId?: string; _sessionId?: string };
  updateUser: { id: string; name: string };
}

// 1. 기본 사용법 (환경변수나 기본 ERROR 레벨 사용)
const actionRegister1 = new ActionRegister<AppActions>();

// 2. 로그 레벨 지정 - TRACE로 변경
const actionRegister2 = new ActionRegister<AppActions>({
  logLevel: LogLevel.TRACE
});

// 3. 커스텀 로거 사용 - TRACE 레벨로 변경
class CustomLogger extends ConsoleLogger {
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[CUSTOM] ${message}`, ...args);
    }
  }
  
  trace(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.log(`[CUSTOM TRACE] ${message}`, ...args);
    }
  }
}

const customLogger = new CustomLogger(LogLevel.TRACE);
const actionRegister3 = new ActionRegister<AppActions>({
  logger: customLogger
});

// 4. OTEL 로거 사용 - TRACE 레벨로 변경
const actionRegister4 = new ActionRegister<AppActions>({
  useOtel: true,
  logLevel: LogLevel.TRACE,
  otelContext: {
    sessionId: 'session-123',
    traceId: 'trace-456'
  }
});

// 5. OTEL 로거 + payload에서 자동 감지 - TRACE 레벨로 변경
const actionRegister5 = new ActionRegister<AppActions>({
  useOtel: true,
  logLevel: LogLevel.TRACE
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
  
  console.log('\n2. TRACE 레벨 로거');
  await actionRegister2.dispatch('increment');
  await actionRegister2.dispatch('setCount', 100);
  
  console.log('\n3. 커스텀 로거 (TRACE 레벨)');
  await actionRegister3.dispatch('increment');
  await actionRegister3.dispatch('setCount', 200);
  
  console.log('\n4. OTEL 로거 (고정 컨텍스트, TRACE 레벨)');
  await actionRegister4.dispatch('increment');
  await actionRegister4.dispatch('setCount', 300);
  
  console.log('\n5. OTEL 로거 (payload 자동 감지, TRACE 레벨)');
  await actionRegister5.dispatch('increment');
  await actionRegister5.dispatch('setCount', 400);
  await actionRegister5.dispatch('setCount', { 
    count: 500, 
    _traceId: 'auto-trace-789',
    _sessionId: 'auto-session-456'
  });
  
  console.log('\n=== 추가 TRACE 로그 예시 ===');
  console.log('TRACE 레벨에서는 다음과 같은 상세 정보가 로깅됩니다:');
  console.log('- 액션 등록 시점');
  console.log('- 액션 디스패치 시작/완료');
  console.log('- 핸들러 실행 시작/완료');
  console.log('- 컨텍스트 정보 (OTEL 사용 시)');
  console.log('- 성능 메트릭');
}

// 환경변수 설정 예시:
// LOG_LEVEL=TRACE node logger-example.js
// ACTION_LOG_LEVEL=TRACE node logger-example.js

runExample().catch(console.error); 