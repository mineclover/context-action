# `ActionRegisterConfig` 인터페이스

## 1. 목적

`ActionRegisterConfig` 인터페이스는 새 `ActionRegister` 인스턴스를 초기화할 때 구성 옵션을 제공하는 데 사용됩니다. 레지스터의 이름, 디버깅 상세도, 기본 실행 모드 및 기타 고급 동작을 사용자 정의할 수 있습니다.

## 2. 구조

`ActionRegisterConfig` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface ActionRegisterConfig {
  /** 이 ActionRegister 인스턴스의 이름 식별자 */
  name?: string;
  
  /** 레지스트리별 구성 옵션 */
  registry?: {
    /** 레지스트리 작업에 대한 디버그 모드 - 상세 로깅 활성화 */
    debug?: boolean;
    
    /** 일회성 핸들러에 대한 자동 정리 구성 */
    autoCleanup?: boolean;
    
    /** 액션에 대한 기본 실행 모드 */
    defaultExecutionMode?: ExecutionMode;
    
    /** 스레드 안전성을 위해 동시성 큐 사용. 기본값: true */
    useConcurrencyQueue?: boolean;
    
    /** 액션당 최대 핸들러 수. 기본값: 1000. 제한을 비활성화하려면 Infinity 사용 (권장하지 않음) */
    maxHandlersPerAction?: number;
    
    /** 처리되지 않은 오류에 대한 전역 오류 핸들러 */
    errorHandler?: (error: Error, context: unknown) => void;
  };
}
```

## 3. 사용 패턴

`ActionRegister` 생성자에 `ActionRegisterConfig` 객체를 전달합니다.

### 기본 구성

더 쉬운 디버깅을 위해 `name`을 제공하고 `defaultExecutionMode`를 설정합니다.

```typescript
import { ActionRegister, ActionRegisterConfig } from '@context-action/core';

const config: ActionRegisterConfig = {
  name: 'MyActionRegister',
  registry: {
    defaultExecutionMode: 'sequential',
  },
};

const actionRegister = new ActionRegister(config);
```

### 디버깅 및 개발

개발 환경에서는 상세 로깅을 위해 `debug` 모드를 활성화할 수 있습니다.

```typescript
const devConfig: ActionRegisterConfig = {
  name: 'DevActionRegister',
  registry: {
    debug: process.env.NODE_ENV === 'development',
    defaultExecutionMode: 'parallel',
  },
};

const devActionRegister = new ActionRegister(devConfig);
```

### 고급 구성

핸들러에 대한 제한을 설정하고, 전역 오류 핸들러를 제공하며, 기타 고급 기능을 구성할 수 있습니다.

```typescript
const advancedConfig: ActionRegisterConfig = {
  name: 'AdvancedActionRegister',
  registry: {
    maxHandlersPerAction: 50,
    errorHandler: (error, context) => {
      console.error(`액션 레지스터에서 오류 발생: ${error.message}`, context);
    },
  },
};

const advancedActionRegister = new ActionRegister(advancedConfig);
```

## 4. TypeDoc 링크

[types.ts의 ActionRegisterConfig](../../../packages/core/src/types.ts)
