# 테스트 기반 문서화 - 보완 필요 사항

## 🔍 발견된 문제점

현재 생성된 API 문서에서 다음 문제들이 발견되었습니다:

### 1. React API 실제 사용 예제 부족

**문제가 있는 API들:**
- `createActionContext` - export 테스트만 존재, 실제 사용 예제 없음
- `useStoreValue` - export 테스트만 존재, 실제 사용 예제 없음
- `createStoreContext` - export 테스트만 존재, 실제 사용 예제 없음
- `useStoreSelector` - export 테스트만 존재, 실제 사용 예제 없음
- `StoreManager` - export 테스트만 존재, 실제 사용 예제 없음

**현재 문서 상태:**
```typescript
// 생성된 문서에서 빈 코드 블록들
#### Example 1: should export createActionContext
```typescript

```

#### Example 2: should export all expected main APIs
```typescript
const expectedExports = [
  'createActionContext',
  'useStoreValue',
  'createStoreContext',
  expectedExports.forEach(exportName => {
  });
```
```

## 📋 추가해야 할 테스트들

### 1. createActionContext 실제 사용 테스트

```typescript
describe('createActionContext usage examples', () => {
  it('should create action context and dispatch actions', async () => {
    // Action types
    interface UserActions {
      updateProfile: { name: string; email: string };
      logout: void;
    }

    // Create action context
    const {
      Provider: UserActionProvider,
      useActionDispatch: useUserAction,
      useActionHandler: useUserActionHandler
    } = createActionContext<UserActions>('UserActions');

    // Test component with handler
    function UserLogic({ children }: { children: React.ReactNode }) {
      useUserActionHandler('updateProfile', async (payload) => {
        console.log('Profile updated:', payload);
      });

      useUserActionHandler('logout', async () => {
        console.log('User logged out');
      });

      return children;
    }

    // Test component with dispatch
    function UserProfile() {
      const dispatch = useUserAction();

      return (
        <button onClick={() => dispatch('updateProfile', {
          name: 'John Doe',
          email: 'john@example.com'
        })}>
          Update Profile
        </button>
      );
    }

    // Integration test
    const TestApp = () => (
      <UserActionProvider>
        <UserLogic>
          <UserProfile />
        </UserLogic>
      </UserActionProvider>
    );

    const { getByText } = render(<TestApp />);
    const button = getByText('Update Profile');

    fireEvent.click(button);

    // Verify handler was called
    expect(mockConsoleLog).toHaveBeenCalledWith('Profile updated:', {
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
});
```

### 2. useStoreValue 실제 사용 테스트

```typescript
describe('useStoreValue usage examples', () => {
  it('should subscribe to store value and trigger re-renders', () => {
    // Create store
    const userStore = createStore('user', { name: 'John', age: 30 });

    // Test component
    function UserDisplay() {
      const user = useStoreValue(userStore);

      return (
        <div>
          <span data-testid="name">{user.name}</span>
          <span data-testid="age">{user.age}</span>
        </div>
      );
    }

    const { getByTestId } = render(<UserDisplay />);

    // Initial render
    expect(getByTestId('name')).toHaveTextContent('John');
    expect(getByTestId('age')).toHaveTextContent('30');

    // Update store
    act(() => {
      userStore.setValue({ name: 'Jane', age: 25 });
    });

    // Check re-render
    expect(getByTestId('name')).toHaveTextContent('Jane');
    expect(getByTestId('age')).toHaveTextContent('25');

    userStore.dispose();
  });

  it('should handle complex store objects', () => {
    const settingsStore = createStore('settings', {
      theme: 'light',
      notifications: {
        email: true,
        push: false
      },
      preferences: {
        language: 'en',
        timezone: 'UTC'
      }
    });

    function SettingsPanel() {
      const settings = useStoreValue(settingsStore);

      return (
        <div>
          <span data-testid="theme">{settings.theme}</span>
          <span data-testid="email">{settings.notifications.email ? 'on' : 'off'}</span>
          <span data-testid="language">{settings.preferences.language}</span>
        </div>
      );
    }

    const { getByTestId } = render(<SettingsPanel />);

    expect(getByTestId('theme')).toHaveTextContent('light');
    expect(getByTestId('email')).toHaveTextContent('on');
    expect(getByTestId('language')).toHaveTextContent('en');

    settingsStore.dispose();
  });
});
```

### 3. createStoreContext 실제 사용 테스트

```typescript
describe('createStoreContext usage examples', () => {
  it('should create store context with type inference', () => {
    // Create store context
    const {
      Provider: AppStoreProvider,
      useStore: useAppStore
    } = createStoreContext('App', {
      user: { name: 'John', isLoggedIn: false },
      settings: { theme: 'light', language: 'en' },
      cart: { items: [], total: 0 }
    });

    // Test component
    function UserInfo() {
      const userStore = useAppStore('user');
      const user = useStoreValue(userStore);

      return (
        <div data-testid="user-info">
          {user.name} - {user.isLoggedIn ? 'Logged In' : 'Logged Out'}
        </div>
      );
    }

    function ThemeDisplay() {
      const settingsStore = useAppStore('settings');
      const settings = useStoreValue(settingsStore);

      return <div data-testid="theme">{settings.theme}</div>;
    }

    function App() {
      return (
        <AppStoreProvider>
          <UserInfo />
          <ThemeDisplay />
        </AppStoreProvider>
      );
    }

    const { getByTestId } = render(<App />);

    expect(getByTestId('user-info')).toHaveTextContent('John - Logged Out');
    expect(getByTestId('theme')).toHaveTextContent('light');
  });

  it('should support store updates with excellent type inference', () => {
    const {
      Provider: GameStoreProvider,
      useStore: useGameStore
    } = createStoreContext('Game', {
      player: {
        name: 'Player1',
        level: 1,
        experience: 0,
        stats: { health: 100, mana: 50 }
      },
      game: {
        state: 'menu' as 'menu' | 'playing' | 'paused',
        score: 0
      }
    });

    function PlayerStats() {
      const playerStore = useGameStore('player');
      const player = useStoreValue(playerStore);

      const levelUp = () => {
        playerStore.update(current => ({
          ...current,
          level: current.level + 1,
          experience: 0,
          stats: {
            ...current.stats,
            health: 100,
            mana: current.stats.mana + 10
          }
        }));
      };

      return (
        <div>
          <span data-testid="level">Level: {player.level}</span>
          <span data-testid="health">Health: {player.stats.health}</span>
          <span data-testid="mana">Mana: {player.stats.mana}</span>
          <button onClick={levelUp} data-testid="level-up">Level Up</button>
        </div>
      );
    }

    function TestApp() {
      return (
        <GameStoreProvider>
          <PlayerStats />
        </GameStoreProvider>
      );
    }

    const { getByTestId } = render(<TestApp />);

    expect(getByTestId('level')).toHaveTextContent('Level: 1');
    expect(getByTestId('mana')).toHaveTextContent('Mana: 50');

    fireEvent.click(getByTestId('level-up'));

    expect(getByTestId('level')).toHaveTextContent('Level: 2');
    expect(getByTestId('mana')).toHaveTextContent('Mana: 60');
  });
});
```

## 🎯 우선순위

### 높음 (즉시 필요)
1. **createActionContext** - 핵심 React API로 실제 사용 예제 필수
2. **useStoreValue** - 가장 많이 사용되는 훅, 다양한 패턴 필요
3. **createStoreContext** - Declarative Store Pattern의 핵심

### 중간 (중요)
4. **useStoreSelector** - 선택적 구독 패턴
5. **StoreManager** - 고급 스토어 관리

### 낮음 (추가 개선)
6. **통합 테스트** - 여러 API를 함께 사용하는 패턴
7. **성능 테스트** - 고빈도 업데이트 시나리오
8. **에러 처리** - 잘못된 사용법에 대한 에러 처리

## 📁 추가할 테스트 파일

```
packages/react/__tests__/
├── createActionContext.usage.test.tsx    # createActionContext 실제 사용
├── useStoreValue.usage.test.tsx          # useStoreValue 다양한 패턴
├── createStoreContext.usage.test.tsx     # createStoreContext 패턴
├── useStoreSelector.usage.test.tsx       # useStoreSelector 사용법
├── patterns/
│   ├── declarative-store.test.tsx        # Declarative Store Pattern
│   ├── action-only.test.tsx              # Action Only Pattern
│   └── integration.test.tsx              # 패턴 조합 사용
└── real-world/
    ├── todo-app.test.tsx                 # 실제 앱 시나리오
    ├── user-management.test.tsx          # 사용자 관리 패턴
    └── settings-panel.test.tsx           # 설정 관리 패턴
```

## 🚀 다음 단계

1. **React 테스트 추가**: 위의 실제 사용 예제 테스트들을 작성
2. **문서 재생성**: 새로운 테스트로 문서를 다시 생성
3. **품질 검증**: 생성된 문서의 예제 품질 확인
4. **실제 시나리오 추가**: example 앱의 패턴을 테스트로 변환

이렇게 하면 각 API가 **실제로 어떻게 사용되는지** 보여주는 의미있는 문서가 생성될 것입니다.