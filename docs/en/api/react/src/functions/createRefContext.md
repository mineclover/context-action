[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createRefContext

# Function: createRefContext()

참조 컨텍스트 생성 함수 (구현)

## Param

컨텍스트 이름

## Param

참조 정의 (선언적 사용 시)

## Example

```typescript
// 방법 1: 심플한 타입 지정 (legacy)
const GameRefs = createRefContext<{
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
}>('GameRefs');

// 방법 2: 선언적 정의 (권장)
const GameRefs = createRefContext('GameRefs', {
  canvas: { name: 'canvas', objectType: 'dom' as const },
  scene: { name: 'scene', objectType: 'three' as const }
});

// 사용법 (직관적이고 간단함)
function GameComponent() {
  const canvas = GameRefs.useRefHandler('canvas');
  const scene = GameRefs.useRefHandler('scene');
  
  // ✅ 올바른 패턴: Hook을 먼저 호출하여 함수 추출
  const waitForRefs = GameRefs.useWaitForRefs();
  
  const initGame = async () => {
    // ✅ 추출한 함수 사용
    const refs = await waitForRefs('canvas', 'scene');
    // 타입 안전한 사용
    refs.canvas?.focus?.();
    console.log('Game initialized with:', refs);
  };
  
  return (
    <GameRefs.Provider>
      <canvas ref={canvas.setRef} />
      <button onClick={initGame}>Initialize Game</button>
      <button onClick={() => canvas.waitForMount().then(c => console.log('Canvas ready:', c))}>
        Check Canvas
      </button>
    </GameRefs.Provider>
  );
}
```

## Call Signature

> **createRefContext**&lt;`T`&gt;(`contextName`): [`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:56](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L56)

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, [`RefTarget`](../interfaces/RefTarget.md)\>

### Parameters

#### contextName

`string`

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

## Call Signature

> **createRefContext**&lt;`T`&gt;(`contextName`, `refDefinitions`): [`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:61](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L61)

### Type Parameters

#### T

`T` *extends* `RefDefinitions`

### Parameters

#### contextName

`string`

#### refDefinitions

Type parameter **T**

### Returns

[`RefContextReturn`](../interfaces/RefContextReturn.md)&lt;`T`&gt;
