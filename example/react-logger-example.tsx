import React, { useState, useCallback } from 'react'
import { createActionContext, LogLevel, ConsoleLogger } from '../packages/react/src'

// 액션 타입 정의
interface AppActions {
  increment: void
  setCount: number
  updateUser: { id: string; name: string }
}

// 1. 기본 사용법 (환경변수나 기본 ERROR 레벨 사용)
const { Provider: BasicProvider, useAction, useActionHandler } = createActionContext<AppActions>()

// 2. 로그 레벨 지정 - TRACE로 변경
const { Provider: DebugProvider, useAction: useDebugAction, useActionHandler: useDebugActionHandler } = createActionContext<AppActions>({
  logLevel: LogLevel.TRACE
})

// 3. OTEL 로거 사용 - TRACE 레벨로 변경
const { Provider: OtelProvider, useAction: useOtelAction, useActionHandler: useOtelActionHandler } = createActionContext<AppActions>({
  useOtel: true,
  logLevel: LogLevel.TRACE,
  otelContext: {
    sessionId: 'react-session-123',
    traceId: 'react-trace-456'
  }
})

// 4. 커스텀 로거 사용 - TRACE 레벨로 변경
class CustomReactLogger extends ConsoleLogger {
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[CUSTOM REACT] ${message}`, ...args)
    }
  }
  
  trace(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.log(`[CUSTOM REACT TRACE] ${message}`, ...args)
    }
  }
}

const customReactLogger = new CustomReactLogger(LogLevel.TRACE)
const { Provider: CustomProvider, useAction: useCustomAction, useActionHandler: useCustomActionHandler } = createActionContext<AppActions>({
  logger: customReactLogger
})

// 컴포넌트들
function BasicCounter() {
  const [count, setCount] = useState(0)
  const dispatch = useAction()
  
  useActionHandler('increment', useCallback(() => {
    console.log('[BASIC] Increment action triggered')
    setCount(prev => prev + 1)
  }, []))
  
  useActionHandler('setCount', useCallback((newCount: number) => {
    console.log(`[BASIC] SetCount action triggered with value: ${newCount}`)
    setCount(newCount)
  }, []))
  
  return (
    <div>
      <h3>Basic Counter (ERROR level)</h3>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('increment')}>Increment</button>
      <button onClick={() => dispatch('setCount', 0)}>Reset</button>
    </div>
  )
}

function DebugCounter() {
  const [count, setCount] = useState(100)
  const dispatch = useDebugAction()
  
  useDebugActionHandler('increment', useCallback(() => {
    console.log('[TRACE] Increment action triggered with detailed tracing')
    setCount(prev => prev + 1)
  }, []))
  
  useDebugActionHandler('setCount', useCallback((newCount: number) => {
    console.log(`[TRACE] SetCount action triggered with value: ${newCount} and detailed tracing`)
    setCount(newCount)
  }, []))
  
  return (
    <div>
      <h3>Debug Counter (TRACE level)</h3>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('increment')}>Increment</button>
      <button onClick={() => dispatch('setCount', 100)}>Reset</button>
    </div>
  )
}

function OtelCounter() {
  const [count, setCount] = useState(200)
  const dispatch = useOtelAction()
  
  useOtelActionHandler('increment', useCallback(() => {
    console.log('[OTEL TRACE] Increment action triggered with OTEL context')
    setCount(prev => prev + 1)
  }, []))
  
  useOtelActionHandler('setCount', useCallback((newCount: number) => {
    console.log(`[OTEL TRACE] SetCount action triggered with value: ${newCount} and OTEL context`)
    setCount(newCount)
  }, []))
  
  return (
    <div>
      <h3>OTEL Counter (with session/trace, TRACE level)</h3>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('increment')}>Increment</button>
      <button onClick={() => dispatch('setCount', 200)}>Reset</button>
    </div>
  )
}

function CustomCounter() {
  const [count, setCount] = useState(300)
  const dispatch = useCustomAction()
  
  useCustomActionHandler('increment', useCallback(() => {
    console.log('[CUSTOM TRACE] Increment action triggered with custom logger')
    setCount(prev => prev + 1)
  }, []))
  
  useCustomActionHandler('setCount', useCallback((newCount: number) => {
    console.log(`[CUSTOM TRACE] SetCount action triggered with value: ${newCount} and custom logger`)
    setCount(newCount)
  }, []))
  
  return (
    <div>
      <h3>Custom Counter (custom logger, TRACE level)</h3>
      <p>Count: {count}</p>
      <button onClick={() => dispatch('increment')}>Increment</button>
      <button onClick={() => dispatch('setCount', 300)}>Reset</button>
    </div>
  )
}

// 메인 앱
function ReactLoggerExample() {
  console.log('[REACT LOGGER] React Logger Example component mounted with TRACE level logging')
  
  return (
    <div>
      <h2>React Logger Example</h2>
      <p>TRACE 레벨에서는 다음과 같은 상세 정보가 로깅됩니다:</p>
      <ul>
        <li>컴포넌트 마운트/언마운트</li>
        <li>액션 디스패치 시작/완료</li>
        <li>핸들러 실행 시작/완료</li>
        <li>컨텍스트 정보 (OTEL 사용 시)</li>
        <li>성능 메트릭</li>
      </ul>
      
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

export default ReactLoggerExample 