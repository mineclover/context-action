# `ActionContextConfig` 인터페이스

## 1. 목적

`ActionContextConfig` 인터페이스는 `createActionContext` 함수에 대한 구성 옵션을 제공합니다. 코어 패키지의 `ActionRegisterConfig`를 확장하여 컨텍스트에 의해 생성된 기본 `ActionRegister` 인스턴스의 동작을 사용자 정의할 수 있습니다.

## 2. 구조

`ActionContextConfig` 인터페이스는 `ActionRegisterConfig`를 확장하고 `name` 속성을 추가합니다.

```typescript
import { ActionRegisterConfig } from '@context-action/core';

export interface ActionContextConfig extends ActionRegisterConfig {
  /** 이 ActionRegister 인스턴스의 이름 식별자 */
  name?: string;
}
```

이는 `name` 외에도 `ActionRegisterConfig`의 모든 속성(예: `registry`, `debug`, `defaultExecutionMode` 등)을 사용할 수 있음을 의미합니다.

## 3. 사용 패턴

`createActionContext` 함수에 `ActionContextConfig` 객체를 전달합니다.

### 컨텍스트 이름 지정하기

`name`을 제공하면 로그 및 개발자 도구에서 특정 액션 컨텍스트를 식별하는 데 도움이 되므로 디버깅에 유용합니다.

```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext({
  name: 'MyAppContext',
});
```

### ActionRegister 구성하기

이 컨텍스트에 대한 액션 레지스터의 동작을 구성하기 위해 유효한 `ActionRegisterConfig` 옵션을 전달할 수 있습니다.

```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext({
  name: 'MyFeatureContext',
  registry: {
    defaultExecutionMode: 'parallel',
    debug: process.env.NODE_ENV === 'development',
  },
});
```

## 4. TypeDoc 링크

[ActionContext.types.ts의 ActionContextConfig](../../../packages/react/src/actions/ActionContext.types.ts)
