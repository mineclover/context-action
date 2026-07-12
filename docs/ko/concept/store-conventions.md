# Store 컨벤션

Context-Action 프레임워크의 Store, TimeTravelStore, MutableStore 패턴에 대한 완전한 컨벤션입니다.

## 📋 목차

1. [Store 타입 개요](#store-타입-개요)
2. [Store (기본)](#store-기본)
3. [TimeTravelStore](#timetravelstore)
4. [MutableStore 패턴](#mutablestore-패턴)
5. [notifyPath/notifyPaths API](#notifypathnotifypaths-api)
6. [이벤트 루프 제어](#이벤트-루프-제어)
7. [성능 가이드라인](#성능-가이드라인)
8. [베스트 프랙티스](#베스트-프랙티스)
9. [비즈니스 로직 분리](#비즈니스-로직-분리)

---

## Store 타입 개요

Context-Action 프레임워크는 세 가지 전문화된 Store 구현을 제공합니다:

| Store 타입 | 구현 | 주요 기능 | 사용 사례 |
|------------|------|-----------|----------|
| **Store** | `createStore()` | 불변성 + Deep Freeze | 일반 상태, 폼, 설정 |
| **TimeTravelStore** | `createTimeTravelStore()` | Undo/Redo + Structural Sharing | 텍스트 에디터, 드로잉 앱 |
| **MutableStore** | undo/redo 없는 TimeTravelStore | Structural Sharing + 성능 | 고빈도 업데이트, 큰 트리 |

### 빠른 선택 가이드

```typescript
// ✅ Store 사용: 일반 상태, 폼, 설정
const formStore = createStore('form', { name: '', email: '' });

// ✅ TimeTravelStore 사용: Undo/redo 기능
const editorStore = createTimeTravelStore('editor', { content: '' });

// ✅ MutableStore 패턴 사용: undo/redo 없는 고성능
// (mutable 모드의 TimeTravelStore, undo/redo 미사용)
const dashboardStore = createTimeTravelStore('dashboard', {
  widgets: [...],
  layout: {...}
}, { mutable: true });
```

---

## Store (기본)

### 개요

완전한 불변성 보장과 안전성 기능을 가진 표준 store입니다.

```typescript
import { createStore } from '@context-action/react';

const userStore = createStore('user', { name: '', email: '' });
```

### 기능

- **Deep Freeze**: 값이 동결되어 실수로 인한 변경 방지
- **Copy-on-Write**: 버전 기반 캐싱을 통한 효율적 복제
- **RAF Batching**: 여러 업데이트를 단일 프레임으로 배치
- **에러 복구**: 문제가 있는 리스너 자동 제거
- **동시성 보호**: 업데이트 큐로 경쟁 조건 방지
- **notifyPath/notifyPaths**: 수동 이벤트 제어 API

### 핵심 API

```typescript
// Store 생성
const store = createStore('name', initialValue);

// 값 읽기
const value = store.getValue();
const snapshot = store.getSnapshot();

// 값 업데이트
store.setValue(newValue);
store.update(draft => { draft.prop = value; });

// 구독
const unsubscribe = store.subscribe(() => {
  console.log('Store 업데이트됨');
});

// 수동 알림
store.notifyPath(['nested', 'property']);
store.notifyPaths([['path1'], ['path2']]);
```

### React 통합

```typescript
import { useStoreValue } from '@context-action/react';

function UserComponent() {
  const userStore = useUserStore('profile');

  // ✅ 반응형 구독
  const user = useStoreValue(userStore);

  // ✅ 업데이트
  const updateName = () => {
    userStore.update(draft => { draft.name = 'New Name'; });
  };

  return <div>{user.name}</div>;
}
```

### 사용 시기

- 일반 상태 관리
- 폼과 설정
- 캐시된 데이터
- 불변성 보장이 중요한 경우
- `useStoreValue()` 구독 사용 시

---

## TimeTravelStore

### 개요

히스토리 관리를 통한 내장 undo/redo 기능을 가진 Store입니다.

```typescript
import { createTimeTravelStore } from '@context-action/react';

const editorStore = createTimeTravelStore('editor',
  { content: '', cursor: 0 },
  { maxHistory: 50, mutable: true }
);
```

### 기능

- **Undo/Redo**: 완전한 히스토리 탐색
- **Structural Sharing**: 변경되지 않은 부분은 같은 참조 유지
- **설정 가능한 히스토리**: `maxHistory` 옵션
- **패치 기반 업데이트**: JSON 패치를 통한 효율적 변경 추적
- **notifyPath/notifyPaths**: 수동 이벤트 제어 API

### 핵심 API

```typescript
// 시간 여행 제어
editorStore.undo();        // 한 단계 뒤로
editorStore.redo();        // 한 단계 앞으로
editorStore.goTo(3);       // 특정 위치로 이동
editorStore.reset();       // 초기 상태로 리셋

// 기능 확인
if (editorStore.canUndo()) { /* ... */ }
if (editorStore.canRedo()) { /* ... */ }

// UI를 위한 제어 가져오기
const { canUndo, canRedo, position, history } = editorStore.getTimeTravelControls();
```

### React 통합

**⚠️ 중요**: `useStoreValue()`가 아닌 `useStorePath()` 사용

```typescript
import { useStorePath, useTimeTravelControls } from '@context-action/react';

function Editor() {
  const editorStore = useEditorStore('document');

  // ✅ 올바름: structural sharing을 위한 useStorePath
  const content = useStorePath(editorStore, ['content']);
  const cursor = useStorePath(editorStore, ['cursor']);

  // ❌ 잘못됨: useStoreValue는 변경을 감지하지 못함
  // const state = useStoreValue(editorStore);

  // 시간 여행 제어
  const { canUndo, canRedo, undo, redo } = useTimeTravelControls(editorStore);

  return (
    <div>
      <textarea value={content} />
      <button onClick={undo} disabled={!canUndo}>실행 취소</button>
      <button onClick={redo} disabled={!canRedo}>다시 실행</button>
    </div>
  );
}
```

### 구독 패턴

```typescript
// TimeTravelStore는 structural sharing 사용
// 최상위 참조는 변경되지 않고, 중첩된 참조만 변경됨

// ❌ 잘못됨: 중첩된 변경 감지 못함
const state = useStoreValue(editorStore);

// ✅ 올바름: 중첩된 참조 변경 감지
const content = useStorePath(editorStore, ['content']);
const cursor = useStorePath(editorStore, ['cursor']);
```

### 사용 시기

- 텍스트 에디터, 드로잉 애플리케이션
- 뒤로/앞으로 탐색이 있는 폼 마법사
- undo/redo가 필요한 모든 기능
- 상태 히스토리로 디버깅
- 히스토리 추적이 필수적인 경우

---

## MutableStore 패턴

### 개요

**정의**: undo/redo 기능을 사용하지 않는 `mutable: true` TimeTravelStore

이 패턴은 히스토리 추적의 오버헤드 없이 **structural sharing**과 **고성능**을 제공하며, 여전히 기술적 기능은 유지합니다.

```typescript
import { createTimeTravelStore } from '@context-action/react';

// MutableStore 패턴: undo/redo를 사용하지 않는 TimeTravelStore
const dashboardStore = createTimeTravelStore('dashboard', {
  user: { name: 'John', settings: { theme: 'dark' } },
  ui: { sidebar: { isOpen: true } }
}, {
  mutable: true  // structural sharing 활성화 (기본값)
  // 참고: undo/redo 메서드는 존재하지만 사용하지 않음
});
```

### 주요 특성

1. **Structural Sharing**: 변경되지 않은 부분은 같은 참조 유지
2. **Undo/Redo 미사용**: 히스토리 메서드는 사용 가능하지만 무시됨
3. **성능 집중**: 고빈도 업데이트에 최적화
4. **notifyPath/notifyPaths**: 고급 이벤트 제어

### 별도 구현이 아닌 이유는?

- TimeTravelStore가 이미 `mutable: true`를 통해 structural sharing 제공
- 단순히 `undo()`, `redo()`, `goTo()` 메서드를 호출하지 않으면 됨
- 코드 중복과 유지보수 오버헤드 방지
- 필요시 나중에 히스토리 활성화 가능

### 사용 패턴

```typescript
// ✅ MutableStore 패턴: undo/redo 없는 TimeTravelStore
const appStore = createTimeTravelStore('app', {
  user: { name: 'John', status: 'online' },
  ui: { loading: false, progress: 0 }
}, { mutable: true });

// 선택적 재렌더링을 위한 structural sharing 사용
const userName = useStorePath(appStore, ['user', 'name']);
const uiLoading = useStorePath(appStore, ['ui', 'loading']);

// 효율적인 structural sharing으로 업데이트
appStore.update(draft => {
  draft.user.name = 'Jane';
  // ['user', 'name'] 경로만 재렌더링 트리거
  // ui.loading 구독자는 재렌더링 안 됨
});

// ⚠️ undo/redo 메서드 사용하지 않음
// appStore.undo();  // MutableStore 패턴에서는 사용 가능하지만 사용 안 함
// appStore.redo();  // MutableStore 패턴에서는 사용 가능하지만 사용 안 함
```

### 고급: 수동 이벤트 제어

```typescript
// 🎯 패턴: 직접 변경 + notifyPath
async function loadUserData() {
  // 1단계: 선택 값 변경 후 해당 경로 알림
  const state = appStore.getValue();
  state.ui.loading = true;
  appStore.notifyPath(['ui', 'loading']);

  // 2단계: 데이터 가져오기
  const userData = await fetchUserData();

  // 3단계: 객체 선택 값은 새 참조로 교체한 뒤 알림
  state.user = userData;
  state.ui.loading = false;
  appStore.notifyPaths([['user'], ['ui', 'loading']]);
}

// 🎯 패턴: 외부 변경 + 알림
function setupWebSocket() {
  ws.on('message', (data) => {
    const state = appStore.getValue();
    state.user.status = data.status; // 직접 변경
    appStore.notifyPath(['user', 'status']);
  });
}
```

`notifyPath`는 강제 렌더링 API가 아니라 알림 API입니다. React 구독은 선택한
스냅샷을 여전히 `Object.is`로 비교합니다. primitive 값 변경은 바로 감지되지만,
선택 값이 객체나 배열이면 알림 전에 새 참조로 교체해야 합니다. `push`, `splice`,
객체 내부 필드의 제자리 변경처럼 기존 참조를 유지하면 해당 selector는 다시
렌더링되지 않습니다.

### MutableStore 패턴 사용 시기

- 고빈도 업데이트 (애니메이션, 실시간 데이터)
- 선택적 재렌더링이 필요한 큰 상태 트리
- 성능에 민감한 애플리케이션
- 외부 시스템 통합 (WebSocket 등)
- undo/redo가 필요하지 않은 경우

### 성능 이점

```typescript
// 전통적 접근: 여러 재렌더링
userStore.update(draft => { draft.loading = true; });  // 재렌더 1
const data = await fetch();
userStore.update(draft => {                             // 재렌더 2
  draft.data = data;
  draft.loading = false;
});
// 총: 2번 재렌더링

// MutableStore 패턴: 영향받는 경로 구독자만 알림
const state = userStore.getValue();
state.loading = true;
userStore.notifyPath(['loading']);                      // loading 구독자만
const data = await fetch();
state.data = data;                                      // 새 data 참조 할당
state.loading = false;
userStore.notifyPaths([['data'], ['loading']]);         // 영향받는 구독자만
```

---

## notifyPath/notifyPaths API

### 개요

상태 변경과 React 업데이트를 분리하는 수동 이벤트 제어 API입니다.

```typescript
// 단일 경로 알림
store.notifyPath(['nested', 'property']);

// 여러 경로 알림
store.notifyPaths([
  ['ui', 'loading'],
  ['ui', 'progress']
]);
```

### 핵심 개념

전통적 상태 관리:
```
상태 변경 → React 재렌더링
```

관찰 가능한 값 변경과 notifyPath 사용:
```
상태 변경 → 수동 알림 → 선택적 React 재렌더링
```

선택한 스냅샷을 변경하지 않고 `notifyPath`만 호출하면 patch-aware 비 React
리스너에는 알림을 보낼 수 있지만 React 렌더링을 강제하지는 않습니다.

### 사용 사례

#### 1. 선택적 로딩 상태 업데이트

```typescript
async function loadData() {
  const state = store.getValue();
  state.loading = true;
  store.notifyPath(['loading']);

  const data = await fetchData();

  // 실제 데이터로 단일 업데이트
  store.setValue({ data, loading: false });
}
```

#### 2. 외부 시스템 통합

```typescript
function setupWebSocket(store: IStore<AppState>) {
  ws.onmessage = (event) => {
    const state = store.getValue();

    // Object.is가 새 스냅샷을 감지하도록 선택 배열 교체
    state.messages = [...state.messages, event.data];

    // React에 알림
    store.notifyPath(['messages']);
  };
}
```

#### 3. 배치 알림

```typescript
function updateMultipleMetrics() {
  const state = store.getValue();

  // 여러 속성 업데이트
  state.ui.loading = false;
  state.ui.progress = 100;
  state.metrics.lastUpdate = Date.now();

  // 단일 배치 알림
  store.notifyPaths([
    ['ui', 'loading'],
    ['ui', 'progress'],
    ['metrics', 'lastUpdate']
  ]);
}
```

### 알림 스케줄링

일반 `Store` 알림은 `requestAnimationFrame`에서 배치됩니다. `TimeTravelStore`는
기본적으로 즉시 알리며, `notificationMode: 'batched'`로 생성한 경우에만 RAF로
배치합니다:

```typescript
// batched 모드에서는 이 호출들이 단일 RAF 프레임으로 배치됨
store.notifyPath(['path1']);
store.notifyPath(['path2']);
store.notifyPaths([['path3'], ['path4']]);

// 결과: 단일 React 업데이트 사이클
```

---

## 이벤트 루프 제어

### 패턴 1: Action Handler + notifyPath

**문제**: 로딩 + 데이터에 대한 여러 재렌더링

```typescript
// ❌ 전통적: 2번 재렌더링
useActionHandler('loadUser', async (payload) => {
  userStore.update(draft => { draft.loading = true; });  // 재렌더 1
  const data = await fetchUser(payload.id);
  userStore.update(draft => {                             // 재렌더 2
    draft.user = data;
    draft.loading = false;
  });
});
```

**해결책**: 수동 이벤트 제어

```typescript
// ✅ 최적화: 1번 재렌더링 (50% 감소)
useActionHandler('loadUser', async (payload) => {
  userStore.notifyPath(['loading']);                      // UI 업데이트만
  const data = await fetchUser(payload.id);
  userStore.update(draft => {                             // 단일 재렌더링
    draft.user = data;
    draft.loading = false;
  });
});
```

### 패턴 2: RefContext + notifyPath

직접 DOM 조작과 선택적 React 업데이트 결합:

```typescript
function ProgressDashboard() {
  const progressBar = useProgressRef('bar');
  const dashboardStore = useAppStore('dashboard');

  const updateProgress = useCallback((progress: number) => {
    // 1단계: 직접 DOM (제로 React 오버헤드)
    if (progressBar.target) {
      progressBar.target.style.width = `${progress}%`;
    }

    // 2단계: 상태 구독자에게 알림
    dashboardStore.notifyPath(['ui', 'progress']);

    // 3단계: 영속성을 위한 store 업데이트
    const state = dashboardStore.getValue();
    state.ui.progress = progress;
  }, [progressBar, dashboardStore]);

  return (
    <div>
      <div ref={progressBar.setRef} className="progress-bar" />
      <ProgressStats /> {/* 이것만 재렌더링 */}
    </div>
  );
}
```

### 패턴 3: 무한 루프 방지

**문제**: 구독이 액션 트리거 → 액션이 store 업데이트 → 구독 트리거

```typescript
// ❌ 무한 루프
useEffect(() => {
  return store.subscribe(() => {
    dispatch('onStoreChange', { data: store.getValue() });
  });
}, []);

useActionHandler('onStoreChange', (payload) => {
  store.setValue(processData(payload.data)); // 구독 트리거!
});
```

**해결책**: notifyPath로 루프 끊기

```typescript
// ✅ 해결책
useEffect(() => {
  return store.subscribe(() => {
    const value = store.getValue();
    if (requiresProcessing(value)) {
      dispatch('onStoreChange', { data: value });
    }
  });
}, []);

useActionHandler('onStoreChange', (payload) => {
  const processed = processData(payload.data);

  // 직접 변경 + 알림 (구독 트리거 없음)
  const state = store.getValue();
  state.processed = processed;
  store.notifyPath(['processed']);
});
```

---

## 성능 가이드라인

### 구독 전략

```typescript
// ✅ Store: useStoreValue 사용
const userStore = createStore('user', { name: '' });
const user = useStoreValue(userStore);

// ✅ TimeTravelStore/MutableStore: useStorePath 사용
const editorStore = createTimeTravelStore('editor', { content: '' });
const content = useStorePath(editorStore, ['content']);

// ❌ 잘못됨: TimeTravelStore에 useStoreValue
const state = useStoreValue(editorStore); // 변경 감지 못함!
```

### 업데이트 전략

```typescript
// Store용 (불변)
userStore.setValue({ name: 'John', email: 'john@example.com' });
userStore.update(draft => { draft.name = 'John'; });

// TimeTravelStore/MutableStore용 (structural sharing)
editorStore.update(draft => {
  draft.content = 'New content';
  // ['content'] 경로만 재렌더링
});
```

### 이벤트 제어 전략

```typescript
// notifyPath 사용:
// 1. 로딩 상태
store.notifyPath(['loading']);

// 2. 외부 변경
const state = store.getValue();
state.prop = externalValue;
store.notifyPath(['prop']);

// 3. 배치 업데이트
store.notifyPaths([['path1'], ['path2']]);

// notifyPath 사용하지 않을 때:
// - 일반 상태 업데이트 (setValue/update 사용)
// - 전체 상태 구독이 필요한 경우
```

---

## 베스트 프랙티스

### 1. 올바른 Store 타입 선택

```typescript
// ✅ Store: 폼, 설정, 일반 상태
const settingsStore = createStore('settings', { theme: 'dark' });

// ✅ TimeTravelStore: Undo/redo 필요
const editorStore = createTimeTravelStore('editor', { content: '' });

// ✅ MutableStore 패턴: 고성능, undo/redo 불필요
const dashboardStore = createTimeTravelStore('dashboard', {
  widgets: [...]
}, { mutable: true });
```

### 2. 올바른 구독 패턴 사용

```typescript
// ✅ Store
const value = useStoreValue(store);

// ✅ TimeTravelStore/MutableStore
const content = useStorePath(store, ['content']);
const cursor = useStorePath(store, ['cursor']);
```

### 3. 성능을 위한 notifyPath 활용

```typescript
// ✅ 재렌더링 감소
store.notifyPath(['loading']);
const data = await fetch();
store.setValue({ data, loading: false });

// ✅ 배치 알림
store.notifyPaths([['path1'], ['path2']]);

// ✅ 외부 통합
state.prop = externalValue;
store.notifyPath(['prop']);
```

### 4. 무한 루프 방지

```typescript
// ✅ 구독에서 notifyPath 사용
store.subscribe(() => {
  const state = store.getValue();
  state.processed = process(state.raw);
  store.notifyPath(['processed']);
});

// ❌ 구독에서 setValue 사용하지 않음
store.subscribe(() => {
  store.setValue(process(store.getValue())); // 루프!
});
```

### 5. 최대 효율을 위한 패턴 결합

```typescript
// ✅ RefContext + notifyPath + MutableStore
function OptimizedComponent() {
  const domRef = useProgressRef('element');
  const store = useDashboardStore('metrics');

  const update = useCallback((value: number) => {
    // 직접 DOM (제로 오버헤드)
    if (domRef.target) {
      domRef.target.style.width = `${value}%`;
    }

    // 구독자에게 알림
    store.notifyPath(['progress']);

    // 상태 영속화
    const state = store.getValue();
    state.progress = value;
  }, [domRef, store]);

  return <div ref={domRef.setRef} />;
}
```

---

## 비즈니스 로직 분리

UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 것은 유지보수성, 테스트 가능성, 확장성에 매우 중요합니다.

### 핵심 원칙

1. **순수 비즈니스 로직**: React와 store 구현으로부터 독립적
2. **상태 머신**: 복잡한 비동기 프로세스를 위한 명시적 상태 전이
3. **진행률 분리**: `notifyPath`를 사용하여 상태 변경과 진행률 업데이트 분리
4. **모듈화 설계**: 테스트 가능한 비즈니스 로직 모듈

### 패턴 개요

Context-Action 프레임워크는 다음을 통해 비즈니스 로직 분리를 지원합니다:

1. **비즈니스 로직 모듈** - React와 독립적인 순수 클래스/함수
2. **비동기 프로세스 상태 머신** - 상태 주도 비동기 작업
3. **진행률 전용 업데이트** - `notifyPath`를 통한 분리된 진행률 추적
4. **모듈화 통합** - 조합 가능한 비즈니스 로직 모듈
5. **상태 머신을 통한 에러 핸들링** - 강력한 에러 복구
6. **다중 파일 큐 관리** - 복잡한 워크플로우

### 빠른 예시

```typescript
// 순수 비즈니스 로직 모듈
class FileUploadService {
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: '파일이 너무 큽니다' };
    }
    return { valid: true };
  }

  async uploadFile(file: File): Promise<UploadResult> {
    // 순수 비동기 로직
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    return response.json();
  }
}

// Action handler와 통합
function FileUploadLogic({ children }) {
  const uploadService = useMemo(() => new FileUploadService(), []);
  const fileStore = useFileStore('upload');

  useFileActionHandler('uploadFile', useCallback(async (payload) => {
    // 검증
    const validation = uploadService.validateFile(payload.file);
    if (!validation.valid) {
      fileStore.setValue({ error: validation.error });
      return;
    }

    // 비즈니스 로직 실행
    try {
      fileStore.setValue({ status: 'uploading', progress: 0 });
      const result = await uploadService.uploadFile(payload.file);
      fileStore.setValue({ status: 'complete', result });
    } catch (error) {
      fileStore.setValue({ status: 'error', error });
    }
  }, [uploadService, fileStore]));

  return children;
}
```

### 종합 가이드

상세한 패턴, 테스트 전략, 고급 예시는 다음을 참조하세요:
**📘 [비즈니스 로직 분리 가이드](./business-logic-separation-guide.md)**

이 전용 가이드는 다음을 다룹니다:
- 완전한 예시를 포함한 6가지 상세 패턴
- 독립적인 비즈니스 로직 테스트
- 성능 특성과 최적화
- Store 및 action과의 통합 전략
- 실제 구현 예시


## 비교 표

```
┌──────────────────────────┬───────────────┬──────────────────┬──────────────────┐
│ 기능                      │ Store         │ TimeTravelStore  │ MutableStore     │
├──────────────────────────┼───────────────┼──────────────────┼──────────────────┤
│ 구현                      │ createStore   │ createTimeTravel │ createTimeTravel │
│ 불변성                    │ ✅ Deep Freeze │ ❌ Mutable Mode  │ ❌ Mutable Mode  │
│ Structural Sharing       │ ❌ 없음        │ ✅ 있음          │ ✅ 있음          │
│ Undo/Redo                │ ❌ 없음        │ ✅ 있음 (사용)   │ ✅ 있음 (무시)   │
│ notifyPath/notifyPaths   │ ✅ 있음        │ ✅ 있음          │ ✅ 있음          │
│ useStoreValue()          │ ✅ 작동        │ ❌ 업데이트 안됨 │ ❌ 업데이트 안됨 │
│ useStorePath()           │ ✅ 작동        │ ✅ 필수          │ ✅ 필수          │
│ RAF Batching             │ ✅ 있음        │ ✅ 있음          │ ✅ 있음          │
│ getValue() 복제          │ ✅ 기본 켜짐   │ ❌ 기본 꺼짐     │ ❌ 기본 꺼짐     │
│ 수동 이벤트 제어          │ ✅ 있음        │ ✅ 있음          │ ✅ 있음          │
│ 외부 변경                 │ ⚠️ 안전하지 않음│ ✅ 안전         │ ✅ 안전          │
│ 사용 사례                 │ 일반 상태     │ Undo/Redo 앱    │ 고성능           │
└──────────────────────────┴───────────────┴──────────────────┴──────────────────┘
```

---

## 관련 문서

- [Main Conventions](./conventions.md) - 전체 프레임워크 컨벤션
- [Hooks Reference](./hooks-reference.md) - 완전한 hooks 문서
- [Architecture Guide](./architecture-guide.md) - 프레임워크 아키텍처
- [Infinite Loop Issues](../../troubleshooting/infinite-loop-issues.md) - 문제 해결 가이드
