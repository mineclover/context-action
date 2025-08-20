# React Refs 관리 가이드

이 가이드는 Context-Action 프레임워크의 **React Refs 관리 시스템**을 다룹니다. DOM 요소, 커스텀 객체, 복잡한 컴포넌트 참조를 타입 안전성과 생명주기 관리와 함께 관리하기 위한 심플하고 안전한 참조 관리 시스템입니다.

> **⚠️ 중요**: ref 관리에는 항상 `createRefContext()`를 사용하세요. 직접적인 `RefStore` 인스턴스화는 권장하지 않으며 내부 프레임워크 사용 전용입니다.

## 개요

React Refs 시스템은 **`createRefContext()` API**를 통해 자동 정리, 타입 안전성, 고급 생명주기 기능을 갖춘 선언적 ref 관리를 제공합니다. 특히 다음과 같은 경우에 유용합니다:

- **DOM 요소 관리**: 적절한 생명주기 처리로 DOM 요소에 안전하게 접근
- **커스텀 객체 참조**: Three.js 객체, 게임 엔진 또는 기타 복잡한 인스턴스 관리
- **비동기 Ref 작업**: ref가 마운트되기를 기다리고 안전한 작업 수행
- **메모리 관리**: 자동 정리 및 메모리 누수 방지

### 🎯 권장 사용 패턴

**✅ 항상 `createRefContext()` 사용**:
```typescript
// ✅ 권장: 모든 ref 관리에 createRefContext 사용
const MyRefs = createRefContext('MyRefs', { /* ... */ });

// ❌ 피할 것: 직접적인 RefStore 사용 (내부 API)
// const store = new RefStore({ name: 'myRef' }); // 이렇게 하지 마세요!
```

## 핵심 개념

### RefContext 시스템

refs 시스템은 `createRefContext()`를 중심으로 구축되며, 내부 `RefStore` 복잡성을 추상화하는 깔끔하고 선언적인 API를 제공합니다:

- **타입 안전성**: 적절한 타입 추론을 통한 완전한 TypeScript 지원
- **생명주기 관리**: 자동 마운트/언마운트 감지
- **안전한 작업**: 오류 처리를 통한 보호된 ref 접근
- **유연한 구성**: 간단하고 고급 구성 옵션 모두 지원
- **내부 최적화**: 내부적으로 `RefStore`를 사용하지만 더 나은 개발자 경험 제공

> **🔧 아키텍처 노트**: `createRefContext()`는 내부적으로 `RefStore` 인스턴스들을 관리하며, 복잡한 생명주기 관리, 오류 처리, 메모리 정리를 모두 자동으로 처리하면서 더 깔끔한 API를 제공합니다.

### 두 가지 구성 방식

#### 1. 간단한 타입 정의 (레거시)
```typescript
import { createRefContext } from '@context-action/react/refs';

// 간단한 타입 지정
const GameRefs = createRefContext<{
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
}>('GameRefs');
```

#### 2. 선언적 정의 (권장)
```typescript
// ✅ 권장: 선언적 구성을 사용한 이름 변경 패턴
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRefHandler,
  useWaitForRefs: useGameWaitForRefs,  // 직접 훅 사용 - 훨씬 직관적!
  useGetAllRefs: useGameGetAllRefs
} = createRefContext('GameRefs', {
  canvas: {
    name: 'canvas',
    autoCleanup: true
  },
  scene: {
    name: 'scene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.dispose();
    }
  }
});
```

## 사용 가능한 관리 전략

| 전략 | 목적 | 사용법 |
|----------|---------|--------|
| `autoCleanup` | 컴포넌트 언마운트 시 자동 정리 | 대부분의 ref는 `true` 사용 |
| `mountTimeout` | ref 마운팅을 기다리는 최대 시간 | 복잡도에 따라 조정 |
| `validator` | 타입 및 유효성 검사 | 타입 안전성에 중요 |
| `cleanup` | 커스텀 정리 함수 | 해제가 필요한 복잡한 객체 |
| `initialMetadata` | 추가 ref 메타데이터 | 디버깅 및 추적 |

### 단순화된 참조 관리

RefContext 시스템은 이제 깊은 복사나 불변성 검사 없이 모든 참조를 싱글톤 객체로 취급합니다. 이는 ref가 복제되어서는 안 되는 싱글톤 객체를 관리하기 위한 것이라는 이해를 바탕으로 합니다.

#### 핵심 원칙:
- **복제 없음**: 모든 ref는 대상 객체에 대한 직접 참조를 유지합니다
- **참조 비교만**: 상태 변경은 참조 동등성을 사용하여 감지됩니다
- **범용 처리**: DOM 요소, 커스텀 객체, Three.js 객체가 모두 동일하게 처리됩니다
- **정리 함수**: 유일한 차별화는 선택적 정리 함수를 통해서입니다

```typescript
// 모든 ref는 동일한 방식으로 처리됩니다 - 싱글톤 참조로
const refs = createRefContext('AppRefs', {
  // DOM 요소 - 특별한 처리 불필요
  container: {
    name: 'container',
    autoCleanup: true
  },
  
  // Three.js 객체 - 필요시 정리 함수만 추가
  scene: {
    name: 'scene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
  },
  
  // 커스텀 객체 - 동일한 패턴
  engine: {
    name: 'engine',
    autoCleanup: true,
    cleanup: async (engine) => {
      await engine.shutdown();
    }
  }
});
```

이 단순화된 접근 방식의 장점:
- React Fiber와의 순환 참조 문제 해결
- 불필요한 복제를 피하여 성능 향상
- 모든 ref 타입에 대해 일관된 동작 제공
- API가 더 간단하고 예측 가능해짐

## 완전한 예제: 게임 컴포넌트

```typescript
import { createRefContext } from '@context-action/react/refs';
import * as THREE from 'three';

// ✅ 권장: 포괄적인 구성을 사용한 이름 변경 패턴
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRefHandler,
  useWaitForRefs: useGameWaitForRefs
} = createRefContext('GameRefs', {
  canvas: {
    name: 'canvas',
    autoCleanup: true,
    validator: (el): el is HTMLCanvasElement => 
      el instanceof HTMLCanvasElement
  },
  scene: {
    name: 'scene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
  },
  engine: {
    name: 'engine',
    mountTimeout: 5000,
    autoCleanup: true,
    cleanup: async (engine) => {
      await engine.stop();
      engine.destroy();
    }
  }
});

function GameComponent() {
  const canvas = useGameRefHandler('canvas');
  const scene = useGameRefHandler('scene');
  const engine = useGameRefHandler('engine');
  
  // ✅ 올바른 사용: 컴포넌트 레벨에서 함수 추출
  const waitForRefs = useGameWaitForRefs();
  
  const initGame = async () => {
    try {
      // 모든 ref가 준비될 때까지 대기
      const refs = await waitForRefs('canvas', 'scene', 'engine');
      
      if (refs.canvas && refs.scene && refs.engine) {
        // 게임 초기화
        const context = refs.canvas.getContext('webgl');
        refs.engine.initialize(context, refs.scene);
        await refs.engine.start();
      }
    } catch (error) {
      console.error('게임 초기화 실패:', error);
    }
  };
  
  return (
    <GameRefsProvider>
      <canvas ref={canvas.setRef} />
      <button onClick={initGame}>게임 시작</button>
    </GameRefsProvider>
  );
}
```

## 성능 최적화 팁

1. **적절한 `mountTimeout` 설정**: 복잡한 객체는 더 긴 타임아웃이 필요할 수 있습니다.
2. **커스텀 `cleanup` 함수 제공**: 리소스 누수를 방지하기 위해 복잡한 객체를 적절히 해제합니다.
3. **`validator` 사용**: 타입 안전성을 보장하고 런타임 오류를 방지합니다.
4. **참조 안정성**: 모든 ref는 싱글톤 객체로 취급되어 성능이 최적화됩니다.

## 마이그레이션 가이드

이전 버전에서 마이그레이션하는 경우:

1. **`objectType` 제거**: 모든 ref 정의에서 `objectType` 속성을 제거하세요.
2. **정리 함수 유지**: 복잡한 객체의 경우 `cleanup` 함수는 그대로 유지하세요.
3. **검증 함수 유지**: `validator` 함수는 타입 안전성을 위해 계속 사용하세요.
4. **단순화된 구성**: 모든 ref는 이제 동일한 방식으로 처리됩니다.

```typescript
// 이전 (objectType 사용)
const refs = createRefContext('MyRefs', {
  element: {
    name: 'element',
    objectType: 'dom',  // ❌ 제거 필요
    autoCleanup: true
  }
});

// 현재 (단순화된 접근)
const refs = createRefContext('MyRefs', {
  element: {
    name: 'element',
    // objectType 제거됨 ✅
    autoCleanup: true
  }
});
```