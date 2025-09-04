# `RefOperationResult` 인터페이스

## 1. 목적

`RefOperationResult` 인터페이스는 `withTarget` 함수(`useRefHandler` 훅에서 제공)를 사용하여 ref 대상에 대해 수행된 작업의 결과를 나타냅니다. 작업의 성공 여부, 작업 결과, 발생한 오류 및 성능 메트릭에 대한 정보를 제공합니다.

## 2. 구조

`RefOperationResult` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface RefOperationResult<T = any> {
  // 작업이 성공했으면 true, 그렇지 않으면 false입니다.
  success: boolean;

  // 작업이 성공한 경우의 결과입니다.
  result?: T;

  // 작업이 실패한 경우 발생한 오류입니다.
  error?: Error;

  // 작업 기간(밀리초)입니다.
  duration?: number;

  // 작업이 완료된 타임스탬프입니다.
  timestamp: number;
}
```

## 3. 사용 패턴

`withTarget` 함수를 호출하면 `RefOperationResult` 객체를 받게 됩니다.

### Ref 작업 결과 확인하기

```typescript
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { withTarget } = useRefHandler('myDiv');

  const handleClick = async () => {
    const operationResult = await withTarget((div) => {
      // div에 대한 일부 작업 수행
      return div.getBoundingClientRect();
    });

    if (operationResult.success) {
      console.log('경계 사각형:', operationResult.result);
      console.log(`작업에 ${operationResult.duration}ms 소요됨`);
    } else {
      console.error('작업 실패:', operationResult.error);
    }
  };

  return <button onClick={handleClick}>경계 사각형 가져오기</button>;
};
```

## 4. TypeDoc 링크

[types.ts의 RefOperationResult](../../../packages/react/src/refs/types.ts)
