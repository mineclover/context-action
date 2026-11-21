# 고급 필터링 시스템

`ActionRegister`에서 디스패치별로 실행할 핸들러를 정밀하게 제어하는 고급 필터링 가이드입니다.

## 🎯 개요

`DispatchOptions['filter']`를 사용하면 매 디스패치마다 **우선순위 범위**, **핸들러 ID 포함/제외**, 또는 `Readonly<ResolvedHandlerConfig>`를 인자로 받는 **커스텀 판별 함수**를 기준으로 등록된 핸들러의 부분집합만 실행할 수 있습니다.

> [!IMPORTANT] Admission Guard 불변식
> `register.registerGuard(...)`로 등록된 **검증/인가 가드(guard)** 는 `options.filter`로 **절대 우회할 수 없습니다**. 필터링은 가드가 아닌 핸들러(커맨드, 결과 핸들러, 옵저버)에만 적용됩니다.

## 🔧 필터 유형

### 우선순위 범위 필터링

`priority` 범위(`min` / `max`, 경계 포함)를 지정해 실행 대상을 제한합니다:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface ProcessActions extends ActionPayloadMap {
  processData: { payload: string };
}

const register = new ActionRegister<ProcessActions>();

async function runFilteredDispatches(data: { payload: string }) {
  // 고우선순위 핸들러만 실행 (50-100)
  await register.dispatch('processData', data, {
    filter: {
      priority: { min: 50, max: 100 }
    }
  });

  // 우선순위 20 이상 핸들러만 실행
  await register.dispatch('processData', data, {
    filter: {
      priority: { min: 20 }
    }
  });

  // 저우선순위 백그라운드 핸들러만 실행 (<= 10)
  await register.dispatch('processData', data, {
    filter: {
      priority: { max: 10 }
    }
  });
}
```

### 핸들러 ID 필터링

등록된 핸들러의 `id`를 기준으로 특정 핸들러만 포함하거나 제외합니다:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface WorkflowActions extends ActionPayloadMap {
  securityCheck: { userId: string };
  processPayment: { amount: number };
  dataProcessing: { batchId: string };
}

const register = new ActionRegister<WorkflowActions>();

async function runByHandlerId() {
  // 지정한 핸들러 ID만 실행
  await register.dispatch('securityCheck', { userId: 'u-1' }, {
    filter: {
      handlerIds: ['validation', 'authorization', 'logging']
    }
  });

  // 분석/디버그 훅을 제외한 나머지 비-가드 핸들러 실행
  await register.dispatch('processPayment', { amount: 42 }, {
    filter: {
      excludeHandlerIds: ['analytics', 'debugging']
    }
  });

  // 포함과 제외 조건 조합 (둘 다 해당하면 제외 조건이 우선)
  await register.dispatch('dataProcessing', { batchId: 'b-9' }, {
    filter: {
      handlerIds: ['core-processing', 'validation', 'optional-analytics'],
      excludeHandlerIds: ['optional-analytics']
    }
  });
}
```

### 커스텀 로직 필터링

`id`, `priority`, `blocking`이 이미 해석된 동결 스냅샷(`Readonly<ResolvedHandlerConfig>`)을 받아 조건을 평가합니다:

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type ResolvedHandlerConfig
} from '@context-action/core';

interface OperationActions extends ActionPayloadMap {
  criticalOperation: { taskId: string; role: 'admin' | 'user' };
}

const register = new ActionRegister<OperationActions>();

async function runCustomFilters(payload: OperationActions['criticalOperation']) {
  // blocking: true 핸들러만 실행
  await register.dispatch('criticalOperation', payload, {
    filter: {
      custom: (config: Readonly<ResolvedHandlerConfig>) => config.blocking === true
    }
  });

  // 사용자 역할에 따른 우선순위 임계값 분기
  await register.dispatch('criticalOperation', payload, {
    filter: {
      custom: (config: Readonly<ResolvedHandlerConfig>) => {
        return payload.role === 'admin'
          ? config.priority >= 50
          : config.priority <= 30;
      }
    }
  });
}
```

### Admission Guard는 필터링으로 건너뛸 수 없음

`handlerIds` 목록에 가드 ID를 넣지 않더라도 `registerGuard()`로 등록된 가드는 항상 먼저 실행됩니다:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface OrderActions extends ActionPayloadMap {
  submitOrder: { total: number };
}

const register = new ActionRegister<OrderActions>();

register.registerGuard(
  'submitOrder',
  (payload, controller) => {
    if (payload.total <= 0) {
      controller.abort('Order total must be positive');
    }
  },
  { id: 'positive-total-guard', priority: 100 }
);

register.register('submitOrder', () => {
  // 가드를 통과한 경우에만 실행
}, { id: 'persist-order', priority: 10 });

async function dispatchProtected() {
  // handlerIds에 'persist-order'만 지정해도 'positive-total-guard'는 계속 실행됨
  await register.dispatch('submitOrder', { total: 0 }, {
    filter: { handlerIds: ['persist-order'] }
  });
}
```

## 🏗️ 복합 필터링

`priority`, `handlerIds` / `excludeHandlerIds`, `custom` 옵션을 함께 지정하면 **모든 조건을 동시에 만족하는** 핸들러만 실행됩니다:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface PipelineActions extends ActionPayloadMap {
  complexWorkflow: { documentId: string };
}

const register = new ActionRegister<PipelineActions>();

async function runCombinedFilter(documentId: string) {
  await register.dispatch('complexWorkflow', { documentId }, {
    filter: {
      priority: { min: 10, max: 50 },
      excludeHandlerIds: ['debug-handler', 'test-handler'],
      custom: (config) => config.blocking === true && !config.id.includes('optional')
    }
  });
}
```

## 🚀 성능 및 재사용 패턴

### 효율적인 필터 설계

- 가능한 경우 커스텀 문자열 파싱 대신 `ActionRegister` 내부의 `Set` 조회를 사용하는 `handlerIds` / `excludeHandlerIds`와 `priority` 범위를 우선 사용하세요.
- 자주 쓰는 `Set`과 `custom` 판별 함수는 모듈 스코프에 재사용해 디스패치마다 새 객체/정규식을 생성하지 않도록 합니다.

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type DispatchOptions,
  type ResolvedHandlerConfig
} from '@context-action/core';

interface TaskActions extends ActionPayloadMap {
  operation: { id: string };
}

const register = new ActionRegister<TaskActions>();

const excludedIds = new Set(['analytics', 'debug']);
const productionFilter = (config: Readonly<ResolvedHandlerConfig>) =>
  !config.id.includes('dev') && !excludedIds.has(config.id);

const criticalFilter: NonNullable<DispatchOptions['filter']> = {
  priority: { min: 80 },
  custom: productionFilter
};

async function executeCriticalTasks() {
  await register.dispatch('operation', { id: 'op-1' }, { filter: criticalFilter });
  await register.dispatch('operation', { id: 'op-2' }, { filter: criticalFilter });
}
```

## 🎯 실전 유스케이스

### 조합 가능한 환경 · 역할 필터 팩토리

<!-- @context-action-compile -->
```typescript
import {
  ActionRegister,
  type ActionPayloadMap,
  type DispatchOptions,
  type ResolvedHandlerConfig
} from '@context-action/core';

interface AppActions extends ActionPayloadMap {
  accessResource: { resourceId: string };
}

const register = new ActionRegister<AppActions>();

function createFilter(options: {
  environment?: 'dev' | 'staging' | 'prod';
  userRole?: 'admin' | 'user' | 'guest';
  priority?: { min?: number; max?: number };
}): NonNullable<DispatchOptions['filter']> {
  return {
    priority: options.priority,
    custom: (config: Readonly<ResolvedHandlerConfig>) => {
      if (options.environment === 'prod' && config.id.includes('dev')) {
        return false;
      }

      if (options.userRole === 'guest' && config.priority > 20) {
        return false;
      }

      return true;
    }
  };
}

async function accessAsGuest(resourceId: string) {
  const filter = createFilter({
    environment: 'prod',
    userRole: 'guest',
    priority: { min: 0, max: 50 }
  });

  await register.dispatch('accessResource', { resourceId }, { filter });
}
```

## 🚨 오류 처리 및 진단

### 일치 핸들러 0건 vs `filter.custom` 예외

조건에 일치하는 비-가드 핸들러가 **0건**이더라도 `dispatch` / `dispatchWithResult`는 예외를 던지지 않고 `result.execution.handlersExecuted === 0`으로 정상 완료됩니다. 예외가 발생하는 경우는 `filter.custom` 콜백 내부에서 직접 에러를 throw한 경우뿐입니다.

빈 매칭 여부를 감지해 폴백을 실행하려면 `dispatchWithResult`와 `getHandlerCount`를 함께 사용하세요:

<!-- @context-action-compile -->
```typescript
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface DiagnosticActions extends ActionPayloadMap {
  syncItem: { id: string };
}

const register = new ActionRegister<DiagnosticActions>();

async function safeFilteredDispatch(id: string) {
  // 일치하는 핸들러가 없어도 예외를 던지지 않고 0건 실행으로 완료됨
  const result = await register.dispatchWithResult(
    'syncItem',
    { id },
    {
      filter: {
        handlerIds: ['nonexistent-handler']
      },
      result: { collect: true }
    }
  );

  const registeredCount = register.getHandlerCount('syncItem');
  const executedCount = result.execution.handlersExecuted;

  if (executedCount === 0 && registeredCount > 0) {
    // 필터가 모든 등록 핸들러를 제외함 — 필요 시 폴백 처리
    return {
      executedCount,
      registeredCount,
      durationMs: result.execution.duration,
      fallbackRequired: true
    };
  }

  return {
    executedCount,
    registeredCount,
    durationMs: result.execution.duration,
    fallbackRequired: false
  };
}
```

## ⚠️ 주요 고려사항

- **가드 보존 원칙**: 유효성 검증이나 권한 확인 로직은 `registerGuard()`로 등록해야 디스패치 필터로 실수로 건너뛰는 일을 막을 수 있습니다.
- **빈 결과 감지**: 필터가 모든 핸들러를 제외할 때 대체 경로가 필요하면 `dispatchWithResult`의 `result.execution.handlersExecuted`를 확인하세요.
- **읽기 전용 스냅샷**: `custom` 필터에는 `Object.freeze({ ...config })`(`Readonly<ResolvedHandlerConfig>`)가 전달되므로 필터 내부에서 핸들러 설정을 변형할 수 없습니다.
- **인터랙티브 데모**: 예제 앱의 `/performance/action-guard/advanced-filtering` 라우트에서 우선순위·핸들러 필터링 동작을 직접 확인할 수 있습니다.
