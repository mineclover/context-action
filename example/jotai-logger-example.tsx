import React from 'react'
import { createAtomContext, LogLevel, OtelContext } from '../packages/jotai/src'

// 1. 기본 사용법 (환경변수나 기본 ERROR 레벨 사용)
const { Provider: BasicProvider, useAtomState, useAtomSetter } = createAtomContext(0)

// 2. 로그 레벨 지정
const { Provider: DebugProvider, useAtomState: useDebugAtomState } = createAtomContext(100, {
  logLevel: LogLevel.DEBUG
})

// 3. OTEL 로거 사용
const { Provider: OtelProvider, useAtomState: useOtelAtomState } = createAtomContext(200, {
  useOtel: true,
  logLevel: LogLevel.DEBUG,
  otelContext: {
    sessionId: 'jotai-session-123',
    traceId: 'jotai-trace-456'
  }
})

// 4. 커스텀 로거 사용
class CustomJotaiLogger extends ConsoleLogger {
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[CUSTOM JOTAI] ${message}`, ...args)
    }
  }
}

const customJotaiLogger = new CustomJotaiLogger(LogLevel.INFO)
const { Provider: CustomProvider, useAtomState: useCustomAtomState } = createAtomContext(300, {
  logger: customJotaiLogger
})

// 컴포넌트들
function BasicCounter() {
  const [count, setCount] = useAtomState()
  const increment = useAtomSetter()
  
  return (
    <div>
      <h3>Basic Counter (ERROR level)</h3>
      <p>Count: {count}</p>
      <button onClick={() => increment(count + 1)}>Increment</button>
    </div>
  )
}

function DebugCounter() {
  const [count, setCount] = useDebugAtomState()
  
  return (
    <div>
      <h3>Debug Counter (DEBUG level)</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

function OtelCounter() {
  const [count, setCount] = useOtelAtomState()
  
  return (
    <div>
      <h3>OTEL Counter (with session/trace)</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

function CustomCounter() {
  const [count, setCount] = useCustomAtomState()
  
  return (
    <div>
      <h3>Custom Counter (custom logger)</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

// 메인 앱
function JotaiLoggerExample() {
  return (
    <div>
      <h2>Jotai Logger Example</h2>
      
      <BasicProvider>
        <BasicCounter />
      </BasicProvider>
      
      <DebugProvider>
        <DebugCounter />
      </DebugProvider>
      
      <OtelProvider>
        <OtelCounter />
      </OtelProvider>
      
      <CustomProvider>
        <CustomCounter />
      </CustomProvider>
    </div>
  )
}

export default JotaiLoggerExample 