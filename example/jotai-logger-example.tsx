import React from 'react'
import { createAtomContext } from '../packages/jotai/src'
import { LogLevel, ConsoleLogger } from '../packages/logger/src'

// 1. 기본 사용법 (환경변수나 기본 ERROR 레벨 사용)
const { Provider: BasicProvider, useAtomState, useAtomSetter } = createAtomContext(0)

// 2. 로그 레벨 지정 - TRACE로 변경 (기본 로거 사용)
const { Provider: DebugProvider, useAtomState: useDebugAtomState } = createAtomContext(100)

// 3. OTEL 로거 사용 - TRACE 레벨로 변경 (기본 로거 사용)
const { Provider: OtelProvider, useAtomState: useOtelAtomState } = createAtomContext(200)

// 4. 커스텀 로거 사용 - TRACE 레벨로 변경
class CustomJotaiLogger extends ConsoleLogger {
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[CUSTOM JOTAI] ${message}`, ...args)
    }
  }
  
  trace(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.log(`[CUSTOM JOTAI TRACE] ${message}`, ...args)
    }
  }
}

const customJotaiLogger = new CustomJotaiLogger(LogLevel.TRACE)
const { Provider: CustomProvider, useAtomState: useCustomAtomState } = createAtomContext(300)

// 컴포넌트들
function BasicCounter() {
  const [count, setCount] = useAtomState()
  const increment = useAtomSetter()
  
  const handleIncrement = () => {
    console.log('[BASIC JOTAI] Increment action triggered')
    increment(count + 1)
  }
  
  return (
    <div>
      <h3>Basic Counter (ERROR level)</h3>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}

function DebugCounter() {
  const [count, setCount] = useDebugAtomState()
  
  const handleIncrement = () => {
    console.log('[TRACE JOTAI] Increment action triggered with detailed tracing')
    setCount(count + 1)
  }
  
  return (
    <div>
      <h3>Debug Counter (TRACE level)</h3>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}

function OtelCounter() {
  const [count, setCount] = useOtelAtomState()
  
  const handleIncrement = () => {
    console.log('[OTEL TRACE JOTAI] Increment action triggered with OTEL context')
    setCount(count + 1)
  }
  
  return (
    <div>
      <h3>OTEL Counter (with session/trace, TRACE level)</h3>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}

function CustomCounter() {
  const [count, setCount] = useCustomAtomState()
  
  const handleIncrement = () => {
    console.log('[CUSTOM TRACE JOTAI] Increment action triggered with custom logger')
    setCount(count + 1)
  }
  
  return (
    <div>
      <h3>Custom Counter (custom logger, TRACE level)</h3>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  )
}

// 메인 앱
function JotaiLoggerExample() {
  console.log('[JOTAI LOGGER] Jotai Logger Example component mounted with TRACE level logging')
  
  return (
    <div>
      <h2>Jotai Logger Example</h2>
      <p>TRACE 레벨에서는 다음과 같은 상세 정보가 로깅됩니다:</p>
      <ul>
        <li>컴포넌트 마운트/언마운트</li>
        <li>Atom 상태 변경 시작/완료</li>
        <li>Atom 구독/구독 해제</li>
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

export default JotaiLoggerExample 