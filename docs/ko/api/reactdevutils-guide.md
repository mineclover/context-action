# `ReactDevUtils` 변수

## 1. 목적

`ReactDevUtils` 객체는 `@context-action` 프레임워크를 사용할 때 React 환경 내에서 디버깅 및 개발을 돕기 위해 특별히 설계된 유틸리티 함수의 컬렉션을 제공합니다. 디버그 모드 활성화, React 관련 정보 로깅, React 통합에 대한 통계 검색과 같은 기능을 제공합니다.

## 2. 구조

`ReactDevUtils`는 다음 메서드를 가진 상수 객체입니다.

```typescript
export const ReactDevUtils = {
  // 상세한 React 통합 디버깅을 활성화합니다.
  enableDebugMode(): void { /* ... */ },

  // React 통합 디버깅을 비활성화합니다.
  disableDebugMode(): void { /* ... */ },

  // React 디버그 모드가 활성화되어 있는지 확인합니다.
  isDebugMode(): boolean { /* ... */ },

  // React 관련 디버깅 정보를 기록합니다.
  log(component: string, action: string, message: string, data?: any): void { /* ... */ },

  // React 통합 통계를 가져옵니다.
  getStats(registry: ActionRegister<any>): {
    totalHandlers: number;
    reactHandlers: number;
    registryInfo: ReturnType<ActionRegister<any>['getRegistryInfo']>;
  } { /* ... */ },
};
```

## 3. 사용 패턴

`ReactDevUtils`는 주로 개발 환경에서 디버깅 및 모니터링에 사용됩니다.

### 디버그 모드 활성화하기

콘솔에서 더 상세한 로깅을 얻으려면 디버그 모드를 활성화할 수 있습니다.

```typescript
import { ReactDevUtils } from '@context-action/core';

ReactDevUtils.enableDebugMode();
```

### 디버그 정보 로깅하기

디버그 모드가 활성화되면 `log` 메서드를 사용하여 특정 디버깅 메시지를 출력할 수 있습니다.

```typescript
import { ReactDevUtils } from '@context-action/core';

if (ReactDevUtils.isDebugMode()) {
  ReactDevUtils.log('MyComponent', 'dataFetch', '데이터를 성공적으로 가져왔습니다', { data: fetchedData });
}
```

### 통계 가져오기

핸들러 수와 같은 React 통합에 대한 통계를 검색할 수 있습니다.

```typescript
import { ReactDevUtils, ActionRegister } from '@context-action/core';

const myRegister = new ActionRegister();
// ... 핸들러 등록

const stats = ReactDevUtils.getStats(myRegister);
console.log('총 핸들러 수:', stats.totalHandlers);
console.log('React 핸들러 수:', stats.reactHandlers);
```

## 4. TypeDoc 링크

[react-helpers.ts의 ReactDevUtils](../../../packages/core/src/react-helpers.ts)
