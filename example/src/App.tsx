import React, { useState } from 'react'
import { createActionContext, ActionPayloadMap } from '@context-action/react'

// 액션 타입 정의
interface AppActionMap extends ActionPayloadMap {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}

// 컨텍스트 생성
const { Provider, useAction, useActionHandler } = createActionContext<AppActionMap>()

function Counter() {
  const [count, setCount] = useState(0)
  const action = useAction()

  // 액션 핸들러 등록
  useActionHandler('increment', () => {
    setCount(prev => prev + 1)
    console.log('Counter incremented')
  }, { priority: 1 })

  useActionHandler('decrement', () => {
    setCount(prev => prev - 1)
    console.log('Counter decremented')
  }, { priority: 1 })

  useActionHandler('setCount', (payload) => {
    setCount(payload)
    console.log('Counter set to:', payload)
  }, { priority: 1 })

  useActionHandler('reset', () => {
    setCount(0)
    console.log('Counter reset')
  }, { priority: 1 })

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Counter: {count}</h3>
      <button onClick={() => action.dispatch('increment')}>+1</button>
      <button onClick={() => action.dispatch('decrement')}>-1</button>
      <button onClick={() => action.dispatch('setCount', 10)}>Set to 10</button>
      <button onClick={() => action.dispatch('reset')}>Reset</button>
    </div>
  )
}

function Logger() {
  useActionHandler('increment', () => {
    console.log('Logger: Increment action detected')
  }, { priority: 0 })

  useActionHandler('decrement', () => {
    console.log('Logger: Decrement action detected')
  }, { priority: 0 })

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Logger Component</h3>
      <p>Check console for logs</p>
    </div>
  )
}

function App() {
  return (
    <Provider>
      <div style={{ padding: '20px' }}>
        <h1>Context Action Test App</h1>
        <p>This app demonstrates the usage of @context-action/core library</p>
        <Counter />
        <Logger />
      </div>
    </Provider>
  )
}

export default App