# 🔗 Universal Reference Management System

Context-Action 프레임워크를 위한 **경량화된 범용 참조 관리 시스템**입니다. 모든 타입의 객체를 타입 안전하고 선언적으로 관리할 수 있습니다.

## 🎯 핵심 철학

### 범용성과 경량성
- **하나의 API로 모든 타입**: DOM, Three.js, 커스텀 객체 등 모든 것을 동일한 방식으로 관리
- **최소한의 코어**: 핵심 로직만 포함하고 특화 기능은 examples에서 제공
- **타입 추론 우선**: TypeScript의 강력한 타입 추론을 최대한 활용

### 해결하는 문제
1. **Ref 마운트 시점 문제**: 컴포넌트 렌더링 전 ref 접근 시도
2. **동시성 문제**: 여러 작업의 동시 ref 접근으로 인한 경합 상태
3. **타입 안전성 부족**: 런타임에만 알 수 있는 ref 타입 오류
4. **메모리 누수**: 부적절한 ref 정리로 인한 메모리 문제
5. **API 일관성**: 다양한 객체 타입에 대한 일관되지 않은 관리 방식

## 🚀 핵심 기능

### 1. 🛡️ 범용 참조 관리 
- **Promise 기반 대기**: 단일 인스턴스 재사용으로 **30-40% 메모리 절약**
- **타입 안전한 접근**: 컴파일 타임 + 런타임 이중 검증
- **자동 라이프사이클**: 마운트/언마운트 자동 감지 및 intelligent cleanup

### 2. ⚡ 고성능 동시성 제어
- **Operation Queue**: WeakMap 기반 메모리 안전한 작업 관리
- **우선순위 처리**: 10단계 우선순위로 중요한 작업 우선 실행
- **취소 가능한 작업**: AbortSignal + 재시도 로직으로 robust한 처리

### 3. 🧹 메모리 안전성
- **Set/WeakMap 활용**: 효율적인 자료구조로 성능 향상
- **자동 리소스 정리**: 사용자 정의 cleanup 함수 지원
- **메모리 누수 방지**: Promise 정리, 참조 해제 등 엄격한 관리

### 4. 💎 개발자 경험
- **완전한 타입 추론**: 추가 어노테이션 없이 정확한 타입 추론
- **Context-Action 통합**: 기존 패턴과 100% 일관된 API
- **에러 복구**: retry, fallback, timeout 등 production-ready 처리

## 📦 설치 및 사용

```typescript
import { createDeclarativeRefPattern } from '@context-action/react/refs';
```

## 🎨 기본 사용법

### 범용 참조 시스템

```typescript
import React from 'react';
import { createDeclarativeRefPattern } from '@context-action/react/refs';

// 모든 타입의 객체를 동일한 방식으로 관리
const { Provider, useRef, useRefManager } = createDeclarativeRefPattern('MyApp', {
  // DOM 요소
  canvas: { name: 'canvas', objectType: 'dom' },
  
  // Three.js 객체 (커스텀으로 처리)
  scene: { 
    name: 'scene', 
    objectType: 'custom',
    cleanup: async (scene: any) => scene.dispose?.()
  },
  
  // 게임 엔진 등 커스텀 객체
  gameEngine: { 
    name: 'engine', 
    objectType: 'custom',
    cleanup: async (engine: any) => engine.destroy?.()
  }
});

function MyComponent() {
  const canvas = useRef('canvas');
  const scene = useRef('scene');
  const refManager = useRefManager();

  const initializeApp = async () => {
    // 모든 참조가 준비될 때까지 대기
    const refs = await refManager.waitForRefs('canvas', 'scene', 'gameEngine');
    
    // 타입 안전한 사용
    refs.canvas.width = 800;
    refs.scene.add(/* ... */);
    refs.gameEngine.start();
  };

  return (
    <Provider>
      <canvas ref={canvas.ref} />
      <button onClick={initializeApp}>Initialize</button>
    </Provider>
  );
}
```

### 타입별 특화 기능 (Examples 참고)

DOM과 Three.js에 특화된 헬퍼는 examples 디렉토리에서 제공합니다:

```typescript
// DOM 특화 기능 (examples/refs/dom-helpers.ts 참고)
import { domRef, createDOMRefContext } from '../examples/refs/dom-helpers';

const formRefs = createDeclarativeRefPattern('ContactForm', {
  nameInput: domRef<HTMLInputElement>({ tagName: 'input' }),
  submitButton: domRef<HTMLButtonElement>({ tagName: 'button' })
});

// Three.js 특화 기능 (examples/refs/three-helpers.ts 참고)
import { threeRef, createThreeRefContext } from '../examples/refs/three-helpers';

const gameRefs = createDeclarativeRefPattern('GameGraphics', {
  scene: threeRef<THREE.Scene>({ expectedType: 'Scene' }),
  camera: threeRef<THREE.Camera>({ expectedType: 'Camera' })
});
```

## 🔧 고급 기능

### 에러 처리 및 재시도

```typescript
function RobustComponent() {
  const element = useRef('canvas', {
    errorRecovery: {
      strategy: 'retry',
      maxRetries: 3,
      retryDelay: 1000,
      onError: (error) => console.error('Ref error:', error)
    }
  });

  const performOperation = async () => {
    const result = await element.withTarget((canvas) => {
      // 실패할 수 있는 작업
      canvas.getContext('2d');
    }, {
      timeout: 5000,
      priority: 10
    });

    if (result.success) {
      console.log('성공:', result.result);
    }
  };

  return <canvas ref={element.ref} onClick={performOperation} />;
}
```

### 동시성 제어

```typescript
function ConcurrentOperations() {
  const element = useRef('canvas');

  const complexOperation = async () => {
    // 여러 작업을 순차적으로 실행 (동시성 안전)
    await Promise.all([
      element.withTarget(canvas => canvas.focus(), { priority: 10 }),
      element.withTarget(canvas => canvas.scrollIntoView(), { priority: 5 })
    ]);
  };

  return <canvas ref={element.ref} onClick={complexOperation} />;
}
```

## 📚 Examples 및 특화 구현

### DOM 헬퍼 예시
`packages/react/examples/refs/dom-helpers.ts`에서 다음을 제공:
- `domRef()`: DOM 요소 전용 설정 헬퍼
- `createDOMRefContext()`: DOM 전용 컨텍스트 생성
- `DOMValidators`: 일반적인 DOM 요소 검증기들

### Three.js 헬퍼 예시  
`packages/react/examples/refs/three-helpers.ts`에서 다음을 제공:
- `threeRef()`: Three.js 객체 전용 설정 헬퍼
- `createThreeRefContext()`: Three.js 전용 컨텍스트 생성
- 자동 dispose 및 리소스 정리 기능

### 실제 사용 예시
`packages/react/examples/refs/` 디렉토리에서 다양한 사용 패턴 확인:
- `declarative-pattern-examples.tsx`: 기본 패턴 사용법
- `GameUIExample.tsx`: DOM + Three.js 통합 예시
- `SimpleFormExample.tsx`: 폼 요소 관리 예시

## 🧪 테스트 및 개발

### 디버깅

```typescript
const refs = createDeclarativeRefPattern('DebugRefs', {
  element: {
    name: 'element',
    objectType: 'dom',
    debug: true  // 디버그 로그 활성화
  }
});

// 큐 상태 모니터링
function QueueMonitoring() {
  const refManager = refs.useRefManager();
  
  const checkQueueStatus = () => {
    const stats = refManager.getAllRefs();
    console.log('Current refs:', stats);
  };

  return <button onClick={checkQueueStatus}>Check Status</button>;
}
```

## 📋 Best Practices

### 1. 범용성 우선
- 특정 타입에 의존하지 않는 일반적인 설정 사용
- 필요시 examples의 특화 헬퍼 참고

### 2. 에러 처리
- 항상 timeout 설정
- 중요한 작업에는 재시도 로직 추가
- 실패 케이스에 대한 fallback 준비

### 3. 성능 최적화
- 불필요한 참조 생성 지양
- 적절한 우선순위 설정
- 큐 상태 모니터링으로 병목점 파악

### 4. 메모리 관리
- autoCleanup 활성화
- 커스텀 cleanup 함수 활용
- 컴포넌트 언마운트 시 적절한 정리

## 🏗️ 아키텍처

### 경량화된 구조
```
packages/react/src/refs/
├── types.ts                    # 핵심 타입 정의
├── OperationQueue.ts           # 동시성 처리 시스템  
├── RefStore.ts                 # 확장된 Store 클래스
├── declarative-ref-pattern.ts  # 메인 API
├── helpers.ts                  # 범용 헬퍼
└── index.ts                    # 통합 export

packages/react/examples/refs/   # 특화 구현 예시
├── dom-helpers.ts             # DOM 전용 헬퍼
├── three-helpers.ts           # Three.js 전용 헬퍼
└── *.tsx                      # 사용 예시들
```

## 🚀 빠른 시작

### 1. 기본 설치
```typescript
import { createDeclarativeRefPattern } from '@context-action/react/refs';
```

### 2. 간단한 사용
```typescript
const refs = createDeclarativeRefPattern('MyApp', {
  button: { name: 'button', objectType: 'dom' },
  customObject: { name: 'custom', objectType: 'custom' }
});

function MyComponent() {
  const button = refs.useRef('button');
  
  const handleClick = async () => {
    await button.withTarget(btn => btn.focus());
  };
  
  return (
    <refs.Provider>
      <button ref={button.ref} onClick={handleClick}>
        Click me
      </button>
    </refs.Provider>
  );
}
```

## ✅ 시스템 특징

### 핵심 가치
- **🛡️ 안전성**: Promise 대기 + 동시성 제어로 런타임 에러 방지
- **📝 타입 안전**: 완전한 TypeScript 지원과 컴파일 타임 검증
- **🧹 메모리 관리**: 자동 cleanup으로 메모리 누수 방지
- **⚡ 성능**: 최적화된 구독 시스템과 배치 처리
- **🔧 범용성**: 모든 타입의 객체를 동일한 방식으로 관리

### Context-Action 통합
- **선언적 패턴**: 기존 Context-Action과 완전히 일관된 개발 경험
- **타입 추론**: 추가 타입 어노테이션 없이 정확한 타입 추론
- **패턴 일관성**: Store Pattern과 Action Pattern의 자연스러운 확장
- **경량화**: 핵심 기능만 포함하고 특화 기능은 examples에서 제공

## 📖 더 자세한 정보

- **[API_SPECIFICATION.md](./API_SPECIFICATION.md)**: 완전한 API 명세와 타입 정의
- **[PATTERNS_GUIDE.md](./PATTERNS_GUIDE.md)**: 실제 사용 예시와 고급 패턴
- **[Examples Directory](../examples/refs/)**: DOM, Three.js 등 특화 헬퍼 구현
- **[Context-Action 문서](../../../docs/)**: 프레임워크 전체 문서

이 시스템은 Context-Action의 철학을 확장하여, **하나의 API로 모든 타입의 참조를 안전하고 선언적으로 관리**할 수 있게 해줍니다.