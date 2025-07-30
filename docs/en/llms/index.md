# LLM Integration

Context Action과 대형 언어 모델(LLM)을 통합하여 AI 기반 액션을 구축하는 방법을 안내합니다.

## Overview

Context Action은 다양한 LLM 서비스와 쉽게 통합할 수 있도록 설계되었습니다. 이를 통해 AI 기반의 스마트한 액션을 만들고 관리할 수 있습니다.

## Supported LLM Providers

### Cloud LLM Services
- **OpenAI**: GPT-4, GPT-3.5-turbo, Function Calling
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku, Tool Use
- **Google**: Gemini Pro, PaLM API
- **Microsoft**: Azure OpenAI Service

### Local LLM Solutions  
- **Ollama**: Local model hosting
- **LM Studio**: Desktop LLM interface
- **Custom Models**: Self-hosted solutions

## Quick Start

### Basic LLM Action

```typescript
import { ActionRegister } from '@context-action/core'
import OpenAI from 'openai'

const actionRegister = new ActionRegister()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// AI 텍스트 생성 액션
actionRegister.register('generateText', {
  handler: async (prompt: string) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000
    })
    
    return response.choices[0]?.message?.content || ''
  }
})

// 사용 예제
const result = await actionRegister.get('generateText')?.execute(
  '브랜딩을 위한 창의적인 슬로건 5개를 생성해주세요'
)
```

### Function Calling with Context Action

```typescript
// Context Action을 OpenAI Function으로 노출
const weatherAction = actionRegister.register('getWeather', {
  handler: async ({ location }: { location: string }) => {
    const response = await fetch(`/api/weather?location=${location}`)
    return response.json()
  }
})

const chatWithTools = actionRegister.register('chatWithTools', {
  handler: async (message: string) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      functions: [
        {
          name: 'getWeather',
          description: '특정 지역의 현재 날씨 정보를 가져옵니다',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: '도시 이름 (예: Seoul, Tokyo)'
              }
            },
            required: ['location']
          }
        }
      ],
      function_call: 'auto'
    })

    const message = response.choices[0]?.message
    
    if (message?.function_call) {
      const functionName = message.function_call.name
      const functionArgs = JSON.parse(message.function_call.arguments || '{}')
      
      // Context Action으로 함수 실행
      const action = actionRegister.get(functionName)
      if (action) {
        const result = await action.execute(functionArgs)
        return {
          type: 'function_result',
          function: functionName,
          result
        }
      }
    }
    
    return {
      type: 'text_response',
      content: message?.content
    }
  }
})
```

## React Integration

### AI 챗봇 컴포넌트

```typescript
import React, { useState } from 'react'
import { useAction } from '@context-action/react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  const chatAction = useAction('chatWithTools')
  
  const handleSend = async () => {
    if (!chatAction || !input.trim()) return
    
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      const response = await chatAction.execute(input)
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.type === 'text_response' 
          ? response.content 
          : `함수 ${response.function} 실행 결과: ${JSON.stringify(response.result)}`
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
        {loading && <div className="loading">AI가 응답하고 있습니다...</div>}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
        />
        <button onClick={handleSend} disabled={loading}>
          전송
        </button>
      </div>
    </div>
  )
}
```

## Advanced Patterns

### Streaming Responses

```typescript
actionRegister.register('streamChat', {
  handler: async function* (prompt: string) {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    })
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
})

// React에서 스트리밍 사용
function StreamingChat() {
  const [response, setResponse] = useState('')
  const streamAction = useAction('streamChat')
  
  const handleStream = async (prompt: string) => {
    if (!streamAction) return
    
    setResponse('')
    const stream = streamAction.execute(prompt)
    
    for await (const chunk of stream) {
      setResponse(prev => prev + chunk)
    }
  }
  
  return (
    <div>
      <div className="streaming-response">{response}</div>
      <button onClick={() => handleStream('Tell me a story')}>
        스토리 생성
      </button>
    </div>
  )
}
```

### LLM Chain Actions

```typescript
// 다단계 LLM 처리 체인
actionRegister.register('analyzeAndSummarize', {
  handler: async (text: string) => {
    // 1단계: 텍스트 분석
    const analysisAction = actionRegister.get('analyzeText')
    const analysis = await analysisAction?.execute(text)
    
    // 2단계: 요약 생성
    const summaryAction = actionRegister.get('generateSummary')
    const summary = await summaryAction?.execute({
      text,
      analysis
    })
    
    // 3단계: 키워드 추출
    const keywordAction = actionRegister.get('extractKeywords')
    const keywords = await keywordAction?.execute(summary)
    
    return {
      originalText: text,
      analysis,
      summary,
      keywords
    }
  }
})
```

### Error Handling and Retry

```typescript
actionRegister.register('robustLLMCall', {
  handler: async (prompt: string) => {
    let retries = 3
    let lastError: Error
    
    while (retries > 0) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }]
        })
        
        return response.choices[0]?.message?.content || ''
      } catch (error) {
        lastError = error as Error
        retries--
        
        if (retries > 0) {
          // 지수 백오프로 재시도
          await new Promise(resolve => 
            setTimeout(resolve, (4 - retries) * 1000)
          )
        }
      }
    }
    
    throw new Error(`LLM 호출 실패 (3회 재시도): ${lastError.message}`)
  }
})
```

## Cost Optimization

### Token 사용량 모니터링

```typescript
let totalTokens = 0

actionRegister.register('monitoredLLMCall', {
  handler: async (prompt: string) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
    
    const usage = response.usage
    if (usage) {
      totalTokens += usage.total_tokens
      console.log(`토큰 사용량: ${usage.total_tokens}, 총 사용량: ${totalTokens}`)
    }
    
    return response.choices[0]?.message?.content || ''
  }
})
```

### 캐싱 전략

```typescript
const responseCache = new Map<string, string>()

actionRegister.register('cachedLLMCall', {
  handler: async (prompt: string) => {
    // 캐시 확인
    if (responseCache.has(prompt)) {
      console.log('캐시에서 응답 반환')
      return responseCache.get(prompt)!
    }
    
    // LLM 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
    
    const content = response.choices[0]?.message?.content || ''
    
    // 캐시 저장
    responseCache.set(prompt, content)
    
    return content
  }
})
```

## Next Steps

- [Getting Started](/llms/getting-started) - LLM 통합 시작하기
- [OpenAI Integration](/llms/openai/chatgpt) - OpenAI API 상세 가이드
- [Anthropic Integration](/llms/anthropic/claude) - Claude API 사용법
- [Local LLMs](/llms/local/ollama) - 로컬 모델 설정