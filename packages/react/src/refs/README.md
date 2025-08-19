# 🔗 Ref Management System

Context-Action 프레임워크를 위한 **심플하고 안전한 참조 관리 시스템**입니다.

## 🚀 기본 사용법

### 방법 1: 심플한 타입 지정

```typescript
import { createRefContext } from '@context-action/react/refs';

// 심플한 타입 지정
const GameRefs = createRefContext<{
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
}>('GameRefs');

function GameComponent() {
  const canvas = GameRefs.useRefHandler('canvas');
  const button = GameRefs.useRefHandler('button');
  
  return (
    <GameRefs.Provider>
      <canvas ref={canvas.setRef} />
      <button ref={button.setRef}>Start Game</button>
    </GameRefs.Provider>
  );
}
```

### 방법 2: 선언적 정의 (권장)

```typescript
// 선언적 정의 (고급 기능 포함)
const GameRefs = createRefContext('GameRefs', {
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

function GameComponent() {
  const canvas = GameRefs.useRefHandler('canvas');
  const scene = GameRefs.useRefHandler('scene');
  
  // ✅ 올바른 패턴: Hook을 먼저 호출하여 함수 추출
  const waitForRefs = GameRefs.useWaitForRefs();
  
  const initGame = async () => {
    const refs = await waitForRefs('canvas', 'scene');
    console.log('All refs ready:', refs);
  };
  
  return (
    <GameRefs.Provider>
      <canvas ref={canvas.setRef} />
      <button onClick={initGame}>Initialize Game</button>
    </GameRefs.Provider>
  );
}
```

## 🔧 주요 기능

- **타입 안전성**: TypeScript 완전 지원
- **비동기 대기**: `waitForMount()`, `useWaitForRefs()` Hook을 통한 다중 ref 대기
- **자동 정리**: 자동 cleanup 및 메모리 관리
- **안전한 작업**: `withTarget()`으로 ref와 함께 안전한 작업 수행
- **관리 전략**: RefDefinitions를 통한 선언적 ref 관리 전략 설정

## 🎯 RefDefinitions 관리 전략

RefDefinitions는 각 ref마다 다른 관리 전략을 적용할 수 있는 강력한 시스템입니다:

```typescript
const AppRefs = createRefContext('AppRefs', {
  // 엄격한 검증이 필요한 입력 필드
  emailInput: {
    name: 'emailInput',
    objectType: 'dom',
    autoCleanup: true,
    mountTimeout: 2000,
    validator: (el): el is HTMLInputElement => 
      el instanceof HTMLInputElement && el.type === 'email'
  },
  
  // 느슨한 관리가 필요한 일반 요소
  infoDiv: {
    name: 'infoDiv', 
    objectType: 'dom',
    autoCleanup: false,  // 수동 관리
    mountTimeout: 5000   // 긴 대기시간
  },
  
  // 복잡한 정리가 필요한 커스텀 객체
  gameEngine: {
    name: 'gameEngine',
    objectType: 'custom',
    autoCleanup: true,
    cleanup: async (engine) => {
      await engine.stopAllSounds();
      engine.disposeResources();
      engine.disconnect();
    }
  }
});
```

### 🛠️ 사용 가능한 관리 전략

- **`autoCleanup`**: 자동 정리 전략 설정
- **`mountTimeout`**: 마운트 타임아웃 전략
- **`validator`**: 타입 검증 전략  
- **`cleanup`**: 커스텀 정리 전략
- **`initialMetadata`**: 메타데이터 관리 전략

## 📚 더 많은 예제

- `examples/refs/` 폴더에서 다양한 사용 예제를 확인하세요
- Simple Form 관리
- Three.js 통합
- 복잡한 게임 UI 관리