# React Refs 관리 가이드

이 가이드는 Context-Action 프레임워크의 **React Refs 관리 시스템**을 다룹니다. DOM 요소, 커스텀 객체, 복잡한 컴포넌트 참조를 타입 안전성과 생명주기 관리와 함께 관리하기 위한 심플하고 안전한 참조 관리 시스템입니다.

## 개요

React Refs 시스템은 자동 정리, 타입 안전성, 고급 생명주기 기능을 갖춘 선언적 ref 관리를 제공합니다. 특히 다음과 같은 경우에 유용합니다:

- **DOM 요소 관리**: 적절한 생명주기 처리로 DOM 요소에 안전하게 접근
- **커스텀 객체 참조**: Three.js 객체, 게임 엔진 또는 기타 복잡한 인스턴스 관리
- **비동기 Ref 작업**: ref가 마운트되기를 기다리고 안전한 작업 수행
- **메모리 관리**: 자동 정리 및 메모리 누수 방지

## 핵심 개념

### RefContext 시스템

refs 시스템은 `createRefContext()`를 중심으로 구축되며 다음을 제공합니다:

- **타입 안전성**: 적절한 타입 추론을 통한 완전한 TypeScript 지원
- **생명주기 관리**: 자동 마운트/언마운트 감지
- **안전한 작업**: 오류 처리를 통한 보호된 ref 접근
- **유연한 구성**: 간단하고 고급 구성 옵션 모두 지원

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
    objectType: 'dom' as const,
    autoCleanup: true
  },
  scene: {
    name: 'scene', 
    objectType: 'custom' as const,
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
| `objectType` | 객체 분류 | `'dom'`, `'custom'`, `'three'` |

### 객체 타입 상세 설명

`objectType` 속성은 RefStore가 다양한 유형의 객체를 처리하는 방식을 결정합니다:

#### `'dom'` - DOM 요소 (기본값)
- **목적**: HTML/DOM 요소에 최적화
- **특별 처리**:
  - React Fiber와의 순환 참조 오류 방지
  - 참조 비교만 사용 (깊은 복사 안 함)
  - 성능을 위해 불변성 검사 건너뛰기
  - DOM 요소 생명주기 자동 처리
- **사용 사례**: HTMLDivElement, HTMLCanvasElement, 모든 DOM 노드
- **참고**: 지정하지 않으면 기본 타입

```typescript
// 지정하지 않으면 자동으로 'dom' 타입 사용
const refs = createRefContext<{
  container: HTMLDivElement;
}>('MyRefs'); // objectType은 'dom'으로 기본 설정

// 또는 명시적으로 지정
const refs = createRefContext('MyRefs', {
  container: {
    name: 'container',
    objectType: 'dom', // 명시적 DOM 타입
    autoCleanup: true
  }
});
```

#### `'custom'` - 커스텀 객체
- **목적**: 범용 객체 관리
- **특별 처리**:
  - 표준 불변성 처리
  - 상태 스냅샷을 위한 깊은 복사
  - 커스텀 정리 함수 지원
- **사용 사례**: 게임 엔진, WebGL 컨텍스트, 커스텀 클래스

```typescript
const refs = createRefContext('GameRefs', {
  engine: {
    name: 'engine',
    objectType: 'custom',
    cleanup: async (engine) => {
      await engine.shutdown();
    }
  }
});
```

#### `'three'` - Three.js 객체
- **목적**: Three.js 씬 그래프 객체
- **특별 처리**:
  - 지오메트리 및 머티리얼 자동 해제
  - 정리를 위한 씬 그래프 순회
  - 텍스처를 위한 리소스 관리
- **사용 사례**: THREE.Scene, THREE.Mesh, THREE.Camera

```typescript
const refs = createRefContext('3DRefs', {
  scene: {
    name: 'scene',
    objectType: 'three',
    cleanup: (scene) => {
      // 자동 리소스 해제
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
  }
});
```

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
    objectType: 'dom',
    autoCleanup: true,
    validator: (el): el is HTMLCanvasElement => 
      el instanceof HTMLCanvasElement
  },
  scene: {
    name: 'scene',
    objectType: 'three',
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
    objectType: 'custom',
    mountTimeout: 5000,
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

1. **DOM 요소는 항상 `objectType: 'dom'` 사용**: 순환 참조 오류를 방지하고 성능을 최적화합니다.
2. **적절한 `mountTimeout` 설정**: 복잡한 객체는 더 긴 타임아웃이 필요할 수 있습니다.
3. **커스텀 `cleanup` 함수 제공**: 리소스 누수를 방지하기 위해 복잡한 객체를 적절히 해제합니다.
4. **`validator` 사용**: 타입 안전성을 보장하고 런타임 오류를 방지합니다.

## 마이그레이션 가이드

이전 버전에서 마이그레이션하는 경우:

1. `objectType`을 지정하지 않은 모든 DOM 요소 ref는 이제 자동으로 `'dom'` 타입을 사용합니다.
2. 커스텀 객체는 명시적으로 `objectType: 'custom'`을 지정해야 합니다.
3. Three.js 객체는 자동 리소스 관리를 위해 `objectType: 'three'`를 사용해야 합니다.