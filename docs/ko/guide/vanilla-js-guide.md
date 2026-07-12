# 바닐라 자바스크립트 가이드

`@context-action/core` 패키지는 프레임워크에 구애받지 않는 액션 파이프라인 관리 라이브러리로, 바닐라 자바스크립트에서 완벽하게 작동합니다. 이 가이드는 React 없이 순수 JavaScript 애플리케이션에서 Context-Action을 사용하는 방법을 보여줍니다.

## 📦 설치

```bash
npm install @context-action/core
# 또는
pnpm add @context-action/core
# 또는
yarn add @context-action/core
```

## 🎯 핵심 개념

Context-Action은 바닐라 자바스크립트를 위한 강력한 액션 파이프라인 시스템을 제공합니다:

1. **ActionRegister**: 중앙 액션 관리 시스템
2. **타입 안전 액션**: 페이로드 타입으로 액션 정의 (TypeScript 선택사항)
3. **우선순위 기반 핸들러**: 우선순위 순서로 핸들러 실행
4. **다중 실행 모드**: Sequential, parallel, race 실행
5. **고급 제어**: 디바운싱, 쓰로틀링, 필터링, 결과 수집

## 🚀 빠른 시작

### 기본 예제

```javascript
import { ActionRegister } from '@context-action/core';

// 1. ActionRegister 인스턴스 생성
const actionRegister = new ActionRegister({
  name: 'AppActions',
  registry: {
    debug: true, // 개발 모드에서 로깅 활성화
    defaultExecutionMode: 'sequential'
  }
});

// 2. 액션 핸들러 등록
const unregister = actionRegister.register(
  'greet',
  async (payload, controller) => {
    console.log(`안녕하세요, ${payload.name}님!`);
    controller.setResult({ greeted: true, name: payload.name });
  },
  { priority: 100 }
);

// 3. 액션 디스패치
await actionRegister.dispatch('greet', { name: '세계' });

// 4. 완료 후 정리
unregister();
```

### TypeScript 사용 (선택사항)

```typescript
import { ActionRegister, ActionPayloadMap } from '@context-action/core';

// 액션 타입 정의
interface AppActions extends ActionPayloadMap {
  greet: { name: string };
  updateUser: { id: string; name: string; email: string };
  logout: void; // 페이로드 없는 액션
}

// 타입이 지정된 ActionRegister 생성
const actionRegister = new ActionRegister<AppActions>({
  name: 'AppActions'
});

// 타입 안전 등록
actionRegister.register('greet', async (payload, controller) => {
  // payload는 { name: string } 타입
  console.log(`안녕하세요, ${payload.name}님!`);
});

// 타입 안전 디스패치
await actionRegister.dispatch('greet', { name: '세계' });
```

## 🎨 실제 예제

### 예제 1: 다중 핸들러를 사용한 폼 검증

```javascript
import { ActionRegister } from '@context-action/core';

const formActions = new ActionRegister({
  name: 'FormActions',
  registry: { defaultExecutionMode: 'sequential' }
});

// 우선순위 기반 검증 파이프라인
formActions.register('submitForm', async (payload, controller) => {
  console.log('1단계: 필수 필드 검증 중...');

  if (!payload.email || !payload.password) {
    controller.abort('필수 필드 누락');
    return;
  }

  controller.setResult({ validation: 'passed' });
}, { priority: 100 }); // 최고 우선순위 - 먼저 검증

formActions.register('submitForm', async (payload, controller) => {
  console.log('2단계: 이메일 형식 확인 중...');

  if (!payload.email.includes('@')) {
    controller.abort('잘못된 이메일 형식');
    return;
  }
}, { priority: 90 });

formActions.register('submitForm', async (payload, controller) => {
  console.log('3단계: 서버에 제출 중...');

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  controller.setResult({ success: true, user: data.user });
}, { priority: 50 }); // 최저 우선순위 - 마지막 실행

// 사용법
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  const result = await formActions.dispatchWithResult('submitForm', formData);

  if (result.success) {
    console.log('로그인 성공!', result.successResults);
    window.location.href = '/dashboard';
  } else {
    console.error('로그인 실패:', result.abortReason);
    alert(result.abortReason);
  }
});
```

### 예제 2: 디바운싱을 사용한 이벤트 시스템

```javascript
import { ActionRegister } from '@context-action/core';

const searchActions = new ActionRegister({
  name: 'SearchActions'
});

// 자동 디바운싱이 적용된 검색 핸들러
searchActions.register('search', async (payload, controller) => {
  console.log('검색 중:', payload.query);

  const results = await fetch(`/api/search?q=${encodeURIComponent(payload.query)}`)
    .then(res => res.json());

  controller.setResult(results);

  // UI 업데이트
  displayResults(results);
}, { debounce: 300 }); // 300ms 디바운스

// 사용법: 실시간 검색
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
  searchActions.dispatch('search', { query: e.target.value });
});

function displayResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = results
    .map(item => `<div class="result">${item.title}</div>`)
    .join('');
}
```

### 예제 3: 상태 관리 패턴

```javascript
import { ActionRegister } from '@context-action/core';

// 간단한 상태 저장소
class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getValue() {
    return this.state;
  }

  setValue(newState) {
    this.state = newState;
    this.notify();
  }

  update(updater) {
    this.state = updater(this.state);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Store 생성
const userStore = new Store({ name: '', email: '', isLoggedIn: false });
const uiStore = new Store({ loading: false, error: null });

// ActionRegister 생성
const appActions = new ActionRegister({ name: 'AppActions' });

// Store 통합 패턴을 따르는 핸들러 등록
appActions.register('login', async (payload, controller) => {
  // 1. 현재 상태 읽기
  const currentUser = userStore.getValue();

  // 2. 비즈니스 로직 실행
  uiStore.setValue({ loading: true, error: null });

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('로그인 실패');

    const data = await response.json();

    // 3. Store 업데이트
    userStore.setValue({
      name: data.user.name,
      email: data.user.email,
      isLoggedIn: true
    });

    uiStore.setValue({ loading: false, error: null });

    controller.setResult({ success: true });
  } catch (error) {
    uiStore.setValue({ loading: false, error: error.message });
    controller.abort(error.message);
  }
});

// Store 변경 구독
userStore.subscribe((state) => {
  console.log('사용자 상태 변경:', state);
  updateUI(state);
});

uiStore.subscribe((state) => {
  const loadingEl = document.getElementById('loading');
  loadingEl.style.display = state.loading ? 'block' : 'none';

  if (state.error) {
    alert(state.error);
  }
});

function updateUI(user) {
  if (user.isLoggedIn) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  }
}

// 사용법
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  await appActions.dispatch('login', { email, password });
});
```

### 예제 4: 독립적 작업을 위한 병렬 실행

```javascript
import { ActionRegister } from '@context-action/core';

const analyticsActions = new ActionRegister({
  name: 'AnalyticsActions',
  registry: { defaultExecutionMode: 'parallel' }
});

// 병렬로 실행되는 다중 분석 핸들러 등록
analyticsActions.register('trackEvent', async (payload) => {
  // Google Analytics로 전송
  await fetch('https://www.google-analytics.com/collect', {
    method: 'POST',
    body: new URLSearchParams({ ...payload, provider: 'ga' })
  });
  console.log('Google Analytics로 전송됨');
}, { priority: 100 });

analyticsActions.register('trackEvent', async (payload) => {
  // Mixpanel로 전송
  await fetch('https://api.mixpanel.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Mixpanel로 전송됨');
}, { priority: 100 });

analyticsActions.register('trackEvent', async (payload) => {
  // 콘솔에 로그 (로컬)
  console.log('이벤트 추적됨:', payload);
}, { priority: 100 });

// 세 핸들러 모두 병렬로 실행
document.getElementById('ctaButton').addEventListener('click', () => {
  analyticsActions.dispatch('trackEvent', {
    event: 'cta_clicked',
    timestamp: Date.now(),
    page: window.location.pathname
  });
});
```

### 예제 5: 고급 결과 수집

```javascript
import { ActionRegister } from '@context-action/core';

const dataActions = new ActionRegister({ name: 'DataActions' });

// 다른 데이터를 반환하는 핸들러 등록
dataActions.register('fetchDashboardData', async (payload, controller) => {
  const users = await fetch('/api/users').then(r => r.json());
  controller.setResult({ users });
}, { priority: 100 });

dataActions.register('fetchDashboardData', async (payload, controller) => {
  const orders = await fetch('/api/orders').then(r => r.json());
  controller.setResult({ orders });
}, { priority: 90 });

dataActions.register('fetchDashboardData', async (payload, controller) => {
  const stats = await fetch('/api/stats').then(r => r.json());
  controller.setResult({ stats });
}, { priority: 80 });

// 모든 결과 수집 및 병합
const result = await dataActions.dispatchWithResult('fetchDashboardData', {}, {
  result: {
    strategy: 'merge',
    collect: true,
    merger: (results) => {
      // 모든 결과를 단일 객체로 병합
      return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    }
  }
});

console.log('대시보드 데이터:', result.result);
// { users: [...], orders: [...], stats: {...} }
```

## 🎯 고급 패턴

### 패턴 1: 핸들러 필터링

```javascript
const actions = new ActionRegister({ name: 'FilteredActions' });

actions.register('processData', handler1, {
  priority: 100,
  id: 'validation'
});

actions.register('processData', handler2, {
  priority: 90,
  id: 'transformation'
});

actions.register('processData', handler3, {
  priority: 80,
  id: 'storage'
});

// 특정 핸들러만 실행
await actions.dispatch('processData', data, {
  filter: {
    handlerIds: ['validation', 'storage'], // transformation 건너뛰기
    priority: { min: 80 } // 우선순위 >= 80인 핸들러만
  }
});
```

### 패턴 2: 조건부 실행

```javascript
let isAuthenticated = false;

actions.register('sensitiveOperation', async (payload, controller) => {
  // 인증된 경우에만 실행
  if (!isAuthenticated) {
    controller.abort('인증되지 않음');
    return;
  }

  // 민감한 작업 진행
  await performSensitiveAction(payload);
}, {
  priority: 100,
  condition: (payload) => isAuthenticated // 실행 전 확인
});
```

### 패턴 3: 오류 시 재시도

```javascript
await actions.dispatch('fetchData', { url: '/api/data' }, {
  retryOnError: {
    maxAttempts: 3,
    delay: 1000 // 재시도 간 1초 대기
  },
  timeout: 5000 // 큐 대기와 재시도 지연을 포함한 전체 5초 타임아웃
});
```

### 패턴 4: AbortController 통합

```javascript
const controller = new AbortController();

// 취소 버튼
document.getElementById('cancelButton').addEventListener('click', () => {
  controller.abort('사용자가 취소함');
});

// 장기 실행 작업
await actions.dispatch('longOperation', data, {
  signal: controller.signal,
  autoAbort: {
    enabled: true,
    onControllerCreated: (ctrl) => {
      // 10초 후 자동 중단
      setTimeout(() => ctrl.abort('타임아웃'), 10000);
    }
  }
});
```

## 🛠️ 유틸리티 헬퍼

### 간단한 바닐라 JS Store

```javascript
export class VanillaStore {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getValue() {
    return this.state;
  }

  setValue(newState) {
    this.state = typeof newState === 'function'
      ? newState(this.state)
      : newState;
    this.notify();
  }

  update(updater) {
    this.setValue(updater(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state); // 즉시 호출
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### 간단한 액션 헬퍼

```javascript
export function createVanillaActions(config = {}) {
  const register = new ActionRegister(config);
  const stores = new Map();

  return {
    register: register.register.bind(register),
    dispatch: register.dispatch.bind(register),
    dispatchWithResult: register.dispatchWithResult.bind(register),

    createStore(name, initialState) {
      const store = new VanillaStore(initialState);
      stores.set(name, store);
      return store;
    },

    getStore(name) {
      return stores.get(name);
    },

    cleanup() {
      register.cleanup();
      stores.clear();
    }
  };
}

// 사용법
const app = createVanillaActions({ name: 'MyApp' });

const userStore = app.createStore('user', { name: '', email: '' });

app.register('updateUser', (payload, controller) => {
  const currentUser = userStore.getValue();
  userStore.setValue({ ...currentUser, ...payload });
});

await app.dispatch('updateUser', { name: 'John' });
```

## 📚 API 참조

### ActionRegister 메서드

- `register(action, handler, config?)` - 액션 핸들러 등록
- `dispatch(action, payload?, options?)` - 액션 디스패치
- `dispatchWithResult(action, payload?, options?)` - 디스패치 후 상세 결과 반환
- `unregister(action, handlerId?)` - 핸들러 제거
- `cleanup()` - 모든 핸들러 제거
- `getRegistryInfo()` - 레지스트리 통계 조회
- `getActionStats(action)` - 액션별 통계 조회

### 핸들러 설정

```typescript
interface HandlerConfig {
  priority?: number;          // 높을수록 먼저 실행
  id?: string;               // 고유 식별자
  blocking?: boolean;        // 완료 대기
  once?: boolean;           // 한 번 실행 후 제거
  debounce?: number;        // 디바운스 지연 (ms)
  throttle?: number;        // 쓰로틀 지연 (ms)
  condition?: (payload) => boolean; // 실행 조건
  cleanup?: () => void;     // 정리 함수
}
```

### 디스패치 옵션

```typescript
interface DispatchOptions {
  debounce?: number;
  throttle?: number;
  executionMode?: 'sequential' | 'parallel' | 'race';
  signal?: AbortSignal;
  timeout?: number;
  retryOnError?: { maxAttempts: number; delay: number };
  filter?: { handlerIds?: string[]; priority?: { min?: number; max?: number } };
  result?: { strategy?: 'first' | 'last' | 'all' | 'merge'; collect?: boolean };
}
```

## 🎓 모범 사례

1. **타입 안전성을 위해 TypeScript 사용** (선택사항이지만 권장)
2. **Store 통합 패턴 따르기**: 읽기 → 실행 → 업데이트
3. **적절한 우선순위 설정**: 검증 (높음) → 비즈니스 로직 (중간) → 부수 효과 (낮음)
4. **사용자 입력에 디바운싱 사용**: 검색, 폼 검증 등
5. **고빈도 이벤트에 쓰로틀링 사용**: 스크롤, 마우스 이동, 리사이즈
6. **핸들러 정리**: 더 이상 필요하지 않을 때 unregister 함수 호출
7. **에러를 우아하게 처리**: 검증 오류에 controller.abort() 사용
8. **실행 모드 활용**: 의존적 작업은 순차, 독립적 작업은 병렬

## 🔗 더 보기

- [Action 패턴 가이드](./patterns/action/index.md)
- [Store 통합 패턴](../concept/store-conventions.md)
- [TypeScript API 참조](../../api/core/README.md)
- [React 통합 가이드](./patterns/action/react-integration.md)
