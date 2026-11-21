# Context-Action 프레임워크

[![npm version](https://img.shields.io/npm/v/@context-action/react.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@context-action/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mineclover/context-action/ci.yml?branch=main&style=flat-square)](https://github.com/mineclover/context-action/actions)

**명시적인 도메인 경계, 타입 안전한 커맨드 파이프라인, 점진적 도입을 지원하는 TypeScript 상태 관리 및 액션 런타임**

**🎯 명확한 관심사 분리** • **🔒 완전한 타입 안전성** • **🧩 점진적 도입** • **🏗️ 헤드리스 우선 아키텍처** • **🌐 프레임워크 중립 코어**

[📚 문서](https://mineclover.github.io/context-action/ko/) • [🎮 라이브 데모](https://mineclover.github.io/context-action/example/) • [⚡ Web Coding Studio](https://mineclover.github.io/context-action/web-coding/) • [🚀 빠른 시작](#-빠른-시작) • [🌟 바닐라 JS](#-바닐라-자바스크립트)

---

## ⚡ 빠른 시작

### 설치

```bash
# React 애플리케이션
npm install @context-action/react

# 헤드리스 TypeScript / 바닐라 JS (액션 파이프라인 + 무의존성 스토어)
npm install @context-action/core @context-action/store-core

# CDN (빠른 브라우저 프로토타이핑)
# <script type="module">
#   import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';
#   import { createStateStore } from 'https://esm.sh/@context-action/store-core@latest';
# </script>
```

### 30초 예제 (React)

```tsx
import { createStoreContext, useStoreValue } from '@context-action/react';

// 1. 도메인 스토어 컨텍스트 생성
const { Provider, useStore } = createStoreContext('User', {
  profile: { name: 'John', email: 'john@example.com' }
});

// 2. 컴포넌트에서 읽고 업데이트
function UserProfile() {
  const profileStore = useStore('profile');
  const profile = useStoreValue(profileStore);

  return (
    <div>
      <h1>환영합니다, {profile.name}님!</h1>
      <button onClick={() => profileStore.setValue({ ...profile, name: 'Jane' })}>
        이름 변경
      </button>
    </div>
  );
}

// 3. Provider로 감싸기
function App() {
  return (
    <Provider>
      <UserProfile />
    </Provider>
  );
}
```

### 30초 예제 (헤드리스 / 바닐라 JS)

```html
<!DOCTYPE html>
<html>
<body>
  <div id="counter">0</div>
  <button id="increment">증가</button>

  <script type="module">
    import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';
    import { createStateStore } from 'https://esm.sh/@context-action/store-core@latest';

    // 무의존성 스토어와 액션 파이프라인 생성
    const store = createStateStore('counter', { count: 0 });
    const actions = new ActionRegister({ name: 'Counter' });

    // 커맨드 핸들러 등록
    actions.register('increment', () => {
      const current = store.getValue();
      store.setValue({ count: current.count + 1 });
    });

    // UI 구독 및 액션 연결
    store.subscribe(() => {
      document.getElementById('counter').textContent = String(store.getValue().count);
    });
    document.getElementById('increment').onclick = () => {
      actions.dispatch('increment');
    };
  </script>
</body>
</html>
```

**📚 [완전한 바닐라 JS 가이드](./docs/ko/guide/vanilla-js-guide.md)** • **[인터랙티브 예제](./examples/vanilla-js/)**

---

## 📈 점진적 도입 (작게 시작해 필요할 때 확장)

기능 규모에 맞는 경계만 선택해 도입할 수 있습니다:

| 단계 | 적합한 상황 | 핵심 API |
| --- | --- | --- |
| **Level 1 · Lite** | 단일 컴포넌트/기능 상태와 타입 안전한 커맨드 | `createStoreContext`, `createActionContext` (또는 `createStateStore` + `ActionRegister`) |
| **Level 2 · Standard** | 헤드리스 오케스트레이션, 역할 기반 검증·실행, 고빈도 DOM 제어 | `<ActionProvider register={...}>`, `<StoreProvider stores={...} \| manager={...}>`, `useActionGuard` / `useActionCommandHandler` / `useActionResultHandler` / `useActionObserver`, `useStorePath`, `createRefContext` |
| **Level 3 · Enterprise** | 다중 팀 도메인, 다중 스토어 원자 Undo/Redo, AI/MCP 도구, 마이크로 프론트엔드 | 6계층 Context-Layered, `StoreTransactionCoordinator`, `@context-action/tool-protocol`, `@context-action/xstate`, `@context-action/lit-ui` / `preact-ui` |

---

## 🎯 왜 Context-Action인가?

### ❌ 기존 상태 관리의 한계
- **높은 React 결합도** → 비즈니스 파이프라인이 컴포넌트와 훅 생명주기에 종속됨
- **이진 상태 접근법** → 거대한 전역 싱글턴 아니면 로컬 `useState`뿐이어서 도메인별 스코프 격리가 어려움
- **비정형 비동기 제어** → 우선순위, 취소(`AbortSignal`), 가드 검증, 다중 스토어 롤백을 매번 수동 구현해야 함

### ✅ Context-Action의 접근법
- **🎯 명시적인 도메인 경계** → 하나의 전역 스토어 대신 도메인 컨텍스트 단위로 상태와 액션 파이프라인을 격리
- **🏗️ 헤드리스 우선 + MVVM 분리** → 프레임워크 중립 `ActionRegister` + `Store` / `StoreManager` / `StateStore`를 React 밖에서 조립한 뒤 `<ActionProvider register={...}>` 및 `<StoreProvider stores={...}>` / `manager={...}` DI로 대칭 주입 가능
- **🔒 타입 우선 계약** → 액션 페이로드, 반환 결과, 가드, 스토어 전체에 걸친 컴파일 타임 타입 추론
- **📈 점진적 확장** → 작은 스토어 컨텍스트로 시작해 필요할 때만 역할별 훅, 6계층 구조, 트랜잭션, AI/웹 컴포넌트 어댑터 추가

### 🚀 주요 이점

```typescript
// 도메인 훅 하나로 상태 읽기와 액션 디스패치 계약을 깔끔하게 제공:
const { profile, updateProfile } = useUserPage();
```

---

<details>
<summary><strong>🏛️ 엔터프라이즈·에코시스템 심화: Implementation Playbook 및 4대 핵심 개발 표준</strong> (클릭하여 펼치기)</summary>

<br/>

### 추천 표준 학습 경로 (Implementation Playbook)

엔터프라이즈 규모의 6계층 표준 패턴과 도구 호출 아키텍처를 한 번에 확인하려면 아래 경로를 참고하세요:

- **표준 컨벤션**: [Implementation Convention](https://mineclover.github.io/context-action/ko/context-layered/implementation-convention)
- **Tool-calling 컨벤션**: [Tool Calling Web Studio 컨벤션](https://mineclover.github.io/context-action/ko/context-layered/usecase-tool-calling-web-studio)
- **canonical example**: [Canonical Order Form](https://mineclover.github.io/context-action/ko/examples/canonical-order-form)
- **시나리오 라이브러리**: [Playbook 시나리오 라이브러리](https://mineclover.github.io/context-action/ko/examples/implementation-playbook-scenarios)
- **라이브 데모**:
  - [Canonical Order](https://mineclover.github.io/context-action/example/patterns/implementation-playbook)
  - [Access Request](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/access-request)
  - [Incident Escalation](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/incident-escalation)
  - [Renewal Risk Review](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/renewal-risk-review)
- **Tool-calling 데모**:
  - [Standalone Web Coding Studio](https://mineclover.github.io/context-action/web-coding/)
- **repo-local skill**: `skills/context-action-implementation-playbook/SKILL.md`
- **검증 명령**:
  - `node scripts/verify-context-action-conventions.mjs`
  - `pnpm test:canonical-example`
  - `pnpm --dir packages/react test -- --runInBand __tests__/patterns/access-request-playbook.integration.test.tsx`
  - `pnpm --dir packages/react test -- --runInBand __tests__/patterns/incident-escalation-playbook.integration.test.tsx`
  - `pnpm --dir packages/react test -- --runInBand __tests__/patterns/renewal-risk-review-playbook.integration.test.tsx`

### 4대 핵심 개발 표준

엔터프라이즈 마이크로 프론트엔드 및 웹 컴포넌트 통합 시 아래 **4대 핵심 개발 표준**을 따릅니다:

1. **📊 상태 관리 아키텍처 (3-Tier State Hierarchy)** ([CA-SPEC-EVIDENCE-001](./docs/ko/context-layered/decisions/CA-SPEC-EVIDENCE-001.md)):
   - **Tier 1 (지속 가능한 도메인 계약)**: 공유 도메인 모델·영속/API DTO·핵심 FSM (`createStoreContext`, `@context-action/store-core`, TypeSpec SSOT).
   - **Tier 2 (일시적 애플리케이션 로직)**: 클라이언트 계산 결과(`*Result.ts`), 폼 제어 값(`@property()` + `ElementInternals.setFormValue()`), 도메인 활동 이벤트(`*Activity.ts`).
   - **Tier 3 (휘발성 프레젠테이션 상태)**: 로컬 UI 상태(`isFocused`, `isOpen`, `activeTab`)는 로컬 `useState`, `createRefContext`, Lit `@state()`, Preact `signal()`로 관리.
   - 선택적 프로젝션, Equality Guard(`Object.is`), Coalesced Pending 지원.
2. **🔌 인터페이스 설계 표준**:
   - 프리미티브 Attribute vs 복합 객체 Property(`attribute: false`) 분리, `{ bubbles: true, composed: true }` 기반 `CustomEvent`, 명령형 인스턴스 메서드, React 18/19 호스트 브리지(`createLitElementBridge`, `createCustomElementBridge`).
3. **🎨 디자인 시스템 통합**:
   - CSS Custom Properties 디자인 토큰, `::part()` 스타일링 훅, Constructable Stylesheets, Adobe React Aria 상태 속성 호환.
4. **🧩 웹 컴포넌트 구현 컨벤션**:
   - Lit(`@context-action/lit` / `lit-ui`)·Preact(`@context-action/preact` / `preact-ui`), W3C Context Protocol(`@lit/context`), `disconnectedCallback` 무누수 해제, FACE(`ElementInternals`).

</details>

---

## 🏗️ 핵심 패턴

### 🏪 스토어 패턴
**반응형 구독을 갖춘 순수 상태 관리**

```typescript
const { Provider: UserStoreProvider, useStore: useUserStore } = createStoreContext('User', {
  profile: { name: '', email: '' },
  settings: { theme: 'light' }
});

function UserComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);

  return <div>{profile.name}</div>;
}
```

### 🎯 액션 패턴
**비즈니스 로직 분리를 갖춘 순수 액션 디스패칭**

```typescript
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  logout: void;
}

const { Provider, useActionDispatch, useActionHandler } =
  createActionContext<UserActions>('UserActions');

function UserLogic() {
  const updateProfileHandler = useCallback(async (payload) => {
    // 비즈니스 로직
    await updateUserAPI(payload);
  }, []);

  useActionHandler('updateProfile', updateProfileHandler);

  return null; // 로직 컴포넌트
}
```

### 🔗 패턴 조합
**복잡한 애플리케이션을 위한 패턴 결합**

```typescript
// MVVM 아키텍처
function App() {
  return (
    <UserActionProvider>     {/* ViewModel */}
      <UserStoreProvider>    {/* Model */}
        <UserLogic>          {/* 비즈니스 로직 */}
          <UserProfile />    {/* View */}
        </UserLogic>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

**📖 [Store별 선택 기준 및 사용법 가이드](./docs/ko/context-layered/store-selection-and-usage-guide.md)** - 패키지 전반 Store/상태 선택 기준:
- `createStoreContext` / `createStore` / `TimeTravelStore` (`@context-action/react`)
- 프레임워크 중립 `createStateStore` (`@context-action/store-core`) 및 헤드리스 백엔드 (`@context-action/react/backend`)
- 파생·로컬 스토어 (`@context-action/react/advanced`), `RefContext`, XState, Preact/Lit, Durable Operations

### 🏗️ 6계층 훅 아키텍처

**Context-Action은 `contexts / business / handlers / actions / hooks / views` 6계층 훅 아키텍처를 통해 관심사의 명확한 분리와 지연 평가 기반의 최적 성능을 제공합니다.**

```mermaid
graph TD
    %% Context Share 계층
    subgraph ContextShare["Context Share 계층 Provider"]
        Store[Store]
        subgraph ActionsContainer["Actions"]
            Actions[Actions]
            Pipeline[Pipeline<br/>- 비즈니스 로직 등록<br/>- 실행 순서 관리<br/>- 미들웨어 처리]
        end
        Ref[Ref<br/>- 싱글톤 인스턴스 관리]
    end

    %% 6-Layer Hooks 구조
    subgraph Hooks["6-Layer Hooks Consumer"]
        ContextDef[contexts<br/>자원 타입 정의]
        Business[business<br/>순수 비즈니스 로직<br/>함수]
        Handlers[handlers<br/>Handler injection<br/>구현 계층]
        ActionHelpers[actions<br/>액션 디스패치<br/>래퍼 함수]
        Subscriptions[hooks<br/>Store 구독 및<br/>파생 데이터]
        Views[views<br/>순수 UI 컴포넌트]
    end

    %% UI 계층
    subgraph UI["UI 계층 - views"]
        Page[Page - route]
        Layout[Layout - device Layer]
        Widget[Widget - design system]
    end

    %% 데이터 흐름
    Store -->|상태 관리| ContextDef
    ContextDef -->|타입 정의| Business
    Business -->|순수 함수| Handlers
    Handlers -->|핸들러 등록| ActionHelpers
    ActionHelpers -->|액션 실행| Pipeline
    Pipeline -->|파이프라인 실행| Store
    Store -->|구독| Subscriptions
    Subscriptions -->|데이터 전달| Views
    Views -->|UI 렌더링| UI
    ActionHelpers -->|액션 발송| Pipeline

    %% UI 마운트 순서
    Page -->|마운트| Layout
    Layout -->|마운트| Widget
```

#### 🔄 데이터 플로우 원칙

1. **Context Share 계층 (Provider)**
   - **Store**: 반응형 구독을 갖춘 중앙집중식 상태 관리
   - **Actions/Pipeline**: 비즈니스 로직 등록 및 실행 순서 관리
   - **Ref**: 성능 최적화를 위한 싱글톤 인스턴스 관리

2. **6계층 훅 구조 (Consumer)**
   - **contexts**: 자원 타입 정의 및 컨텍스트 접근
   - **business**: 사이드 이펙트와 분리된 순수 비즈니스 로직 함수
   - **handlers**: `store.getValue()` 지연 평가를 사용하는 핸들러 등록 계층
   - **actions**: 뷰 지향 액션 디스패치 함수 및 콜백 관리
   - **hooks**: UI 업데이트를 위한 선택적 상태 구독과 파생 값
   - **views**: 최소 결합을 유지하는 순수 UI 컴포넌트

3. **UI 계층 (Views)**
   - **Page**: 라우트 레벨 컴포넌트
   - **Layout**: 디바이스별 레이아웃 컴포넌트
   - **Widget**: 디자인 시스템 컴포넌트

#### ⚡ 성능 이점

- **지연 평가**: 핸들러가 `store.getValue()`를 통해 최신 상태에 접근
- **선택적 구독**: 컴포넌트가 필요한 상태 조각만 구독
- **최소 리렌더링**: 최적화된 의존성 추적으로 불필요한 업데이트 방지
- **싱글톤 관리**: Ref 레이어가 효율적인 리소스 공유 보장

```typescript
// 6계층 구현 예제 (contexts / business / handlers / actions / hooks / views)
// 1. business: 순수 도메인 변환
const applyProfilePatch = (current: UserProfile, patch: Partial<UserProfile>) => ({
  ...current,
  ...patch,
});

// 2. handlers: 지연 평가 store.getValue() 기반 핸들러 등록
function UserHandlers({ children }: { children: React.ReactNode }) {
  const userStore = useUserStore('profile');

  const updateUserHandler = useCallback(async (payload: Partial<UserProfile>) => {
    const currentUser = userStore.getValue();
    userStore.setValue(applyProfilePatch(currentUser, payload));
  }, [userStore]);

  useActionHandler('updateUser', updateUserHandler);
  return <>{children}</>;
}

// 3. hooks + views: 선택적 구독 및 액션 디스패치
function UserPage() {
  const user = useStoreValue(useUserStore('profile'));
  const dispatch = useUserActionDispatch();

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => dispatch('updateUser', { name: '새 이름' })}>
        사용자 업데이트
      </button>
    </div>
  );
}
```

---

## 🔗 타입 시스템 가이드라인

**Context-Action은 Action, Store, Ref 연결 전반에 걸쳐 완전한 TypeScript 안전성을 제공하며 런타임 오버헤드가 없는 정교한 타입 시스템을 구현합니다.**

### 🎯 타입 선언 아키텍처

```mermaid
graph TB
    %% Type Declaration Layer
    subgraph TypeDeclarations["🔤 타입 선언 계층"]
        PayloadMap[ActionPayloadMap<br/>액션 페이로드 타입 맵]
        StoreTypes[StoreDefinitions<br/>스토어 타입 정의]
        RefTypes[Ref Types<br/>싱글톤 참조 타입]
    end

    %% Context Creation Layer
    subgraph ContextCreation["⚙️ 컨텍스트 생성 계층"]
        ActionContext[createActionContext&lt;T&gt;<br/>액션 컨텍스트 생성]
        StoreContext[createStoreContext&lt;T&gt;<br/>스토어 컨텍스트 생성]
        RefManager[RefManager&lt;T&gt;<br/>참조 관리자]
    end

    %% Hook Layer
    subgraph HookLayer["🪝 훅 계층"]
        ActionHooks[useActionDispatch<br/>useActionHandler]
        StoreHooks[useStore<br/>useStoreValue]
        RefHooks[useRef<br/>useCallback]
    end

    %% Type Flow Connections
    PayloadMap -->|extends| ActionContext
    StoreTypes -->|initialStores| StoreContext
    RefTypes -->|singleton| RefManager

    ActionContext -->|typed hooks| ActionHooks
    StoreContext -->|typed hooks| StoreHooks
    RefManager -->|stable refs| RefHooks

    %% Type Safety Flow
    ActionHooks -->|type-safe dispatch| PayloadMap
    StoreHooks -->|reactive types| StoreTypes
    RefHooks -->|stable references| RefTypes
```

### ⚡ 타입 연결 패턴

#### 1. **액션 타입 선언 및 연결**

```typescript
// 1️⃣ 액션 페이로드 타입 정의
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string; avatar?: File };
  deleteAccount: { confirmPassword: string };
  logout: void; // 페이로드 없음
}

// 2️⃣ 타입화된 액션 컨텍스트 생성
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// 3️⃣ 타입 안전 핸들러 등록
function UserLogic() {
  // ✅ 페이로드가 자동으로 { name: string; email: string; avatar?: File }로 타입화됨
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // payload.name ✅ string
    // payload.email ✅ string
    // payload.avatar ✅ File | undefined
    await updateUserAPI(payload);
  }, []));

  // ✅ 페이로드가 자동으로 void로 타입화됨
  useUserActionHandler('logout', useCallback(async () => {
    await clearSession();
  }, []));
}

// 4️⃣ 타입 안전 액션 디스패칭
function UserComponent() {
  const dispatch = useUserAction();

  return (
    <button onClick={() =>
      dispatch('updateProfile', {
        name: 'John',
        email: 'john@example.com'
        // ✅ TypeScript가 올바른 페이로드 형태를 강제함
      })
    }>
      프로필 업데이트
    </button>
  );
}
```

#### 2. **스토어 타입 선언 및 연결**

```typescript
// 1️⃣ 스토어 타입 정의 (두 가지 접근법)

// 접근법 A: 단순 객체 타입
const { Provider, useStore } = createStoreContext('User', {
  profile: { name: '', email: '', isOnline: false }, // ✅ 타입 추론
  settings: { theme: 'light' as const, notifications: true }, // ✅ const 단언
  preferences: { language: 'ko', timezone: 'Asia/Seoul' }
});

// 접근법 B: 명시적 스토어 구성
interface UserStoreConfig {
  profile: StoreConfig<UserProfile>;
  settings: StoreConfig<UserSettings>;
  cache: StoreConfig<CacheData>; // ✅ 전략 구성 포함
}

const { Provider, useStore } = createStoreContext('User', {
  profile: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' }, strategy: 'shallow' },
  cache: { initialValue: new Map(), strategy: 'reference' }
} satisfies UserStoreConfig);

// 2️⃣ 타입 안전 스토어 접근 및 구독
function UserProfile() {
  const profileStore = useStore('profile'); // ✅ Store<UserProfile>
  const profile = useStoreValue(profileStore); // ✅ UserProfile 타입

  // ✅ 타입 안전 스토어 작업
  profileStore.setValue({ name: 'John', email: 'john@example.com', isOnline: true });
  profileStore.update(prev => ({ ...prev, isOnline: !prev.isOnline }));

  return <div>{profile.name}</div>; // ✅ profile.name은 string
}
```

#### 3. **Ref 타입 선언 및 싱글톤 관리**

```typescript
import { createRefContext, createStoreContext } from '@context-action/react';

// 1️⃣ 가변 요소·명령형 핸들을 위한 Ref 타입 선언
interface AppRefs {
  editorInput: HTMLInputElement;
  apiClient: ApiClient;
}

// 2️⃣ StoreContext(상태)와 RefContext(참조) 분리 선언
const { Provider: AppStoreProvider, useStore } = createStoreContext('App', {
  user: { name: '', email: '' },
});

const { Provider: AppRefProvider, useRefHandler: useAppRef } =
  createRefContext<AppRefs>('AppRefs');

// 3️⃣ 타입 안전 Ref 접근
function ApiComponent() {
  const apiClientRef = useAppRef('apiClient'); // ✅ RefState<ApiClient>
  const userStore = useStore('user');

  const fetchUser = useCallback(async (id: string) => {
    const client = apiClientRef.target;
    if (!client) return;
    const userData = await client.get(`/users/${id}`);
    userStore.setValue(userData);
  }, [apiClientRef, userStore]);

  return <button onClick={() => fetchUser('123')}>사용자 가져오기</button>;
}
```

### 🛡️ 타입 안전성 이점

#### **컴파일 타임 검증**
- ✅ **액션 페이로드 검증**: 잘못된 페이로드 형태를 컴파일 시점에 감지
- ✅ **스토어 타입 일관성**: 컴포넌트 전반에 걸쳐 스토어 값 타입 강제
- ✅ **Ref 타입 안정성**: 리렌더링에 걸쳐 싱글톤 참조 타입 유지
- ✅ **훅 반환 타입**: 모든 훅이 적절히 타입화된 값과 함수 반환

#### **IntelliSense 및 개발자 경험**
- 🔍 **자동 완성**: 액션명, 페이로드 속성, 스토어 키에 대한 완전한 IntelliSense
- 🏷️ **타입 힌트**: 호버 정보로 정확한 페이로드 및 스토어 타입 표시
- ⚠️ **오류 방지**: TypeScript가 런타임 오류를 사전에 방지
- 🔄 **리팩토링 안전성**: 전체 코드베이스에 걸친 타입 안전 리팩토링

#### **제로 런타임 오버헤드**
- ⚡ **컴파일 타임 전용**: 모든 타입 정보는 프로덕션 빌드에서 제거
- 📦 **타입 라이브러리 없음**: 런타임 타입 체킹 의존성 없음
- 🎯 **직접적인 성능**: 타입이 런타임 비용 없이 최적화 가이드

### 📚 **상세 타입 시스템 문서**

포괄적인 타입 시스템 커버리지는 전용 가이드를 참조하세요:

#### **한국어 문서**
- **[🎯 액션 타입 시스템](https://mineclover.github.io/context-action/ko/guide/patterns/action/type-system)** - ActionPayloadMap, 타입 안전성, TypeScript 통합
- **[🏪 Store별 선택 기준 및 사용법 가이드](https://mineclover.github.io/context-action/ko/context-layered/store-selection-and-usage-guide)** - 패키지 전반의 타입 안전 Store 선택 매트릭스

#### **영어 문서**
- **[📖 TypeScript Type Inference Guide](https://mineclover.github.io/context-action/en/guide/type-inference)** - 완전한 타입 추론 개요
- **[🎯 Action Type System](https://mineclover.github.io/context-action/en/guide/patterns/action/type-system)** - ActionPayloadMap, 파이프라인 컨트롤러, 핸들러 타입

#### **핵심 타입 시스템 기능**
- **액션 타입 안전성**: 파이프라인 컨트롤러 타입을 갖춘 완전한 `ActionPayloadMap` 인터페이스
- **스토어 타입 추론**: 전략 지원을 갖춘 초기값으로부터의 자동 타입 추론
- **핸들러 구성**: 포괄적인 옵션을 갖춘 타입 안전 핸들러 등록
- **통합 패턴**: 스토어 통합, 비동기 처리, 오류 관리
- **고급 기능**: 조건부 타입, 브랜드 타입, 제네릭 유틸리티

---

## 📋 API 참조

### 핵심 함수

#### `createStoreContext(name, stores)`
반응형 구독을 갖춘 타입화된 스토어 컨텍스트 생성.
```typescript
const { Provider, useStore } = createStoreContext('App', {
  user: { name: '', email: '' },
  settings: { theme: 'light' }
});
```

#### `createActionContext<T>(name)`
파이프라인 처리를 갖춘 타입화된 액션 컨텍스트 생성.
```typescript
interface Actions extends ActionPayloadMap {
  update: { id: string };
}
const { Provider, useActionDispatch } = createActionContext<Actions>('App');
```

### 필수 훅

#### `useStoreValue(store)`
자동 리렌더링과 함께 스토어 변경사항 구독.
```typescript
const userStore = useStore('user');
const user = useStoreValue(userStore); // 반응형 구독
```

#### `useActionHandler(action, handler)`
액션을 위한 비즈니스 로직 핸들러 등록.
```typescript
const updateProfileHandler = useCallback(async (payload) => {
  // 비즈니스 로직
}, []);

useActionHandler('updateProfile', updateProfileHandler);
```

#### `useActionDispatch()`
파이프라인에 액션 디스패치.
```typescript
const dispatch = useActionDispatch();
dispatch('updateProfile', { name: 'John', email: 'john@example.com' });
```

---

## 🎮 예제 및 데모

### 🌟 바닐라 자바스크립트

**[📁 인터랙티브 바닐라 JS 예제](./examples/vanilla-js/)** - 빌드 도구 불필요!

- **[기본 카운터](./examples/vanilla-js/basic-counter.html)** - 비동기 작업이 있는 간단한 카운터
- **[Todo 앱](./examples/vanilla-js/todo-app.html)** - 완전한 기능의 Todo 애플리케이션
- **[완전한 가이드](./docs/ko/guide/vanilla-js-guide.md)** - 5가지 실전 패턴과 예제

브라우저에서 HTML 파일을 바로 열거나 다음을 실행하세요:
```bash
npx serve examples/vanilla-js
# 그리고 방문: http://localhost:3000/basic-counter.html
```

### 🚀 React 라이브 예제
**[정식 예제 라우트 탐색 →](https://mineclover.github.io/context-action/example/)** ([카탈로그 명세](./catalog/repository-surface/example-surface.v1.json))

#### 🏪 **스토어 시스템**
- [스토어 기초](https://mineclover.github.io/context-action/example/foundations/store/basics) - 스토어 생성, 갱신, 구독 기본
- [Time Travel Store](https://mineclover.github.io/context-action/example/foundations/store/time-travel) - undo/redo 히스토리 및 타임라인 탐색
- [React Provider 및 훅](https://mineclover.github.io/context-action/example/foundations/react/provider) - 선언적 Action/Store Provider 분리

#### 🎯 **액션 시스템**
- [코어 액션 기초](https://mineclover.github.io/context-action/example/foundations/core/basics) - 프레임워크 중립 ActionRegister 파이프라인 기본
- [ActionGuard 검색](https://mineclover.github.io/context-action/example/performance/action-guard/search) - 디바운싱·중단 가능 검색 파이프라인
- [우선순위 시스템](https://mineclover.github.io/context-action/example/performance/priority/demo) - 우선순위 스케줄링 및 실행 추적

#### 🔗 **Context-Layered 및 Playbook 예제**
- [Canonical Order Form](https://mineclover.github.io/context-action/example/patterns/implementation-playbook) - 6계층 표준 기준 워크플로
- [레이어드 아키텍처](https://mineclover.github.io/context-action/example/patterns/layered-architecture) - contexts, handlers, hooks, views 분리 구조

### 📖 실제 예제

```typescript
// 전자상거래 장바구니 시스템
const CartStores = createStoreContext('Cart', {
  items: [] as CartItem[],
  total: 0,
  shipping: { method: 'standard', cost: 0 }
});

// 사용자 관리 시스템
interface UserActions extends ActionPayloadMap {
  login: { email: string; password: string };
  updateProfile: Partial<UserProfile>;
  logout: void;
}
```

### 🔍 **관측성 및 개발자 도구**
- **[📊 Action Lifecycle Workbench](https://mineclover.github.io/context-action/example/integrations/action-lifecycle)** - 디스패치 트레이스, 핸들러 실행 단계, 중단 상태 점검
- **[📋 로거 시스템 데모](https://mineclover.github.io/context-action/example/utilities/dev-tools/logger)** - 인터랙티브 LogMonitor 쇼케이스
- **[⚠️ 경고 및 스토어 시나리오](https://mineclover.github.io/context-action/example/utilities/dev-tools/warning-demo)** - 의존성 경고 방지 및 스토어 전략 비교

---

## 📚 문서

### 📖 완전한 가이드
- **[📚 공식 문서](https://mineclover.github.io/context-action/ko/)** - 전체 가이드 및 API 포털
- **[🚀 시작하기 가이드](https://mineclover.github.io/context-action/ko/guide/getting-started)** - 5분 설정
- **[🏗️ Context-Layered 아키텍처](https://mineclover.github.io/context-action/ko/context-layered/context-layered-guide)** - 실전 6계층 구현 가이드
- **[🧭 개발 컨벤션 인덱스](https://mineclover.github.io/context-action/ko/context-layered/convention-index)** - 작업별 표준·게이트 중심 인덱스
- **[📦 저장소 표면 카탈로그](https://mineclover.github.io/context-action/ko/context-layered/repository-surface-catalog)** - 워크스페이스 패키지·정식 예제 라우트·관리 문서 전체 목록 (`CA-SURFACE-CATALOG-001`)
- **[🏪 Store별 선택 기준 및 사용법 가이드](https://mineclover.github.io/context-action/ko/context-layered/store-selection-and-usage-guide)** - 패키지 전반 Store 선택 매트릭스
- **[📋 핵심 철학 및 아키텍처](https://mineclover.github.io/context-action/ko/concept/architecture-guide)** - 5가지 핵심 원칙, Headless-First DI, MVVM 분리
- **[⚡ 모범 사례](https://mineclover.github.io/context-action/ko/guide/best-practices)** - 프로덕션 패턴
- **[📜 문서 및 개발 관리 컨벤션](https://mineclover.github.io/context-action/ko/concept/documentation-development-conventions)** - 문서 작성 기준 및 검증 게이트

### 🌏 다국어 지원
- **[🇰🇷 한국어 문서](https://mineclover.github.io/context-action/ko/)** - 완전한 한국어 가이드
- **[🇺🇸 English Documentation](https://mineclover.github.io/context-action/en/)** - Complete English guides

---

## 📦 패키지

모노레포는 **6개 레이어에 걸친 20개 워크스페이스 패키지**(공개 16개, 내부 워크스페이스 도구 4개)로 구성됩니다. 전체 패키지 목록, export subpath, 검증 게이트는 [저장소 표면 카탈로그](./docs/ko/context-layered/repository-surface-catalog.md) 및 [`api-surface.v1.json`](./catalog/repository-surface/api-surface.v1.json)을 참고하세요.

- **[@context-action/core](./packages/core)** — 무의존성 프레임워크 중립 액션 파이프라인 (`ActionRegister`, 가드, 우선순위, 취소, `./element` 호스트 바인딩)
- **[@context-action/store-core](./packages/store-core)** — 프레임워크 중립 `StateBackend`, `TimelineBackend`, `TransactionBackend` 및 `createStateStore` 계약
- **[@context-action/mutative-core](./packages/mutative-core)** & **[@context-action/mutative](./packages/mutative)** — Upstream 호환 불변 엔진(`mutative@2.0.2` 계보)과 `StateBackend` / 타임트래블 어댑터
- **[@context-action/react](./packages/react)** — React 18/19 MVVM Context 바인딩 (`createActionContext`, `createStoreContext`, `createTimeTravelStoreContext`, `createRefContext`, `./backend`, `./advanced`, `./utils`, `./webmcp`)
- **[@context-action/xstate](./packages/xstate)** — XState v5/v6(`.`) 및 Effect(`./effect`) 선택형 어댑터
- **[@context-action/lit](./packages/lit)** & **[@context-action/lit-ui](./packages/lit-ui)** — Lit ReactiveController, W3C `@lit/context`, FACE 컨트롤, SSR/하이드레이션, React 브리지
- **[@context-action/preact](./packages/preact)** & **[@context-action/preact-ui](./packages/preact-ui)** — Preact Context + Signals 어댑터, mount/hydrate 루트, 커스텀 엘리먼트 브리지, React 브리지
- **[@context-action/tool-protocol](./packages/tool-protocol)**, **[@context-action/tool-durable-operations](./packages/tool-durable-operations)**, **[@context-action/ai-sdk](./packages/ai-sdk)** & **[@context-action/webmcp](./packages/webmcp)** — Zod 기반 액션 스키마, MCP/provider 도구 계약, lease/fence 기반 내구적 mutation 복구, AI SDK 및 브라우저 WebMCP 어댑터

---

## 🛠️ 개발

### 빠른 개발 설정
```bash
git clone https://github.com/mineclover/context-action.git
cd context-action
pnpm install
pnpm dev  # 예제 앱 시작
```

### 프로젝트 리소스
- **[📋 Local-First 검증 정책](./docs/LOCAL_FIRST_VERIFICATION_POLICY.md)** - 로컬 우선 검증 및 서명 영수증 규약 (`pnpm verify:quick` / `pnpm verify`)
- **[🤝 기여 가이드](./CONTRIBUTING.md)** - 기여 방법
- **[🌐 생태계](./ECOSYSTEM.md)** - 도구와 생성기
- **[🛠️ 개발 가이드](./DEVELOPMENT.md)** - 상세한 개발 설정

---

## 📄 라이선스

Apache-2.0 © [mineclover](https://github.com/mineclover)

---

<div align="center">

**현대적인 TypeScript 애플리케이션을 위해 ❤️으로 제작**

[⭐ GitHub에서 스타하기](https://github.com/mineclover/context-action) • [🐛 버그 신고](https://github.com/mineclover/context-action/issues) • [💡 기능 요청](https://github.com/mineclover/context-action/discussions)

</div>
