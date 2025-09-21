# Create Action Context - Enhanced Documentation

> 🔄 **자동 생성된 문서**: 이 문서는 테스트 코드에서 자동 추출되었습니다.
> 최종 수정: 2025-09-21


`createActionContext`는 타입 안전한 액션 기반 상태 관리를 위한 Context를 생성합니다.

**핵심 특징:**
- 완전한 TypeScript 타입 안전성
- 우선순위 기반 핸들러 실행
- 자동 에러 처리 및 중단 지원
- React Context API와의 완벽한 통합
## 📚 사용법 예제

### 🚀 기본 사용법

#### 🔴 기본 액션 컨텍스트 생성 및 사용법

```typescript
    it('should create action context and dispatch actions with payload', async () => {
      // Define action types with proper payload mapping
      interface UserActions extends ActionPayloadMap {
        updateProfile: { name: string; email: string };
        logout: void;
      }

      // Create action context
      const {
        Provider: UserActionProvider,
        useActionDispatch: useUserAction,
        useActionHandler: useUserActionHandler
      } = createActionContext<UserActions>('UserActions');

      // Track handler calls for verification
      const handlerCalls: any[] = [];

      // Test component with action handlers
      function UserLogic({ children }: { children: React.ReactNode }) {
        useUserActionHandler('updateProfile', useCallback(async (payload) => {
          handlerCalls.push({ action: 'updateProfile', payload });
        }, []));

        useUserActionHandler('logout', useCallback(async () => {
          handlerCalls.push({ action: 'logout', payload: undefined });
        }, []));

        return <>{children}</>;
      }

      // Test component with action dispatch
      function UserProfile() {
        const dispatch = useUserAction();

        return (
          <div>
            <button
              data-testid="update-profile"
              onClick={() => dispatch('updateProfile', {
                name: 'John Doe',
                email: 'john@example.com'
              })}
            >
              Update Profile
            </button>
            <button
              data-testid="logout"
              onClick={() => dispatch('logout')}
            >
              Logout
            </button>
          </div>
        );
      }

      // App integration
      const TestApp = () => (
        <UserActionProvider>
          <UserLogic>
            <UserProfile />
          </UserLogic>
        </UserActionProvider>
      );

      const { getByTestId } = render(<TestApp />);

      // Test updateProfile action
      fireEvent.click(getByTestId('update-profile'));

      await waitFor(() => {
        expect(handlerCalls).toHaveLength(1);
        expect(handlerCalls[0]).toEqual({
          action: 'updateProfile',
          payload: { name: 'John Doe', email: 'john@example.com' }
        });
      });

      // Test logout action
      fireEvent.click(getByTestId('logout'));

      await waitFor(() => {
        expect(handlerCalls).toHaveLength(2);
        expect(handlerCalls[1]).toEqual({
          action: 'logout',
          payload: undefined
        });
      });
    }
```

**주요 포인트:**
- Context Provider를 사용한 컴포넌트 래핑
- 액션 핸들러를 통한 비즈니스 로직 분리
- 타입 안전한 액션 디스패칭
- 비동기 처리 지원
- TypeScript 인터페이스를 통한 타입 안전성
- React 성능 최적화 패턴 적용

**테스트 위치:** [`createActionContext.usage.test.tsx`](https://github.com/mineclover/context-action/blob/main/packages/react/__tests__/createActionContext.usage.test.tsx) (줄 8)

---

### 🔧 고급 패턴

#### 🟡 우선순위 기반 다중 핸들러 처리

```typescript
    it('should handle multiple handlers for the same action with priority', async () => {
      interface AppActions extends ActionPayloadMap {
        initialize: { userId: string };
      }

      const {
        Provider: AppActionProvider,
        useActionDispatch: useAppAction,
        useActionHandler: useAppActionHandler
      } = createActionContext<AppActions>('AppActions');

      const executionOrder: string[] = [];

      function HighPriorityHandler() {
        useAppActionHandler('initialize', useCallback(async (payload) => {
          executionOrder.push(`high-priority: ${payload.userId}`);
        }, []), { priority: 100 });

        return null;
      }

      function LowPriorityHandler() {
        useAppActionHandler('initialize', useCallback(async (payload) => {
          executionOrder.push(`low-priority: ${payload.userId}`);
        }, []), { priority: 10 });

        return null;
      }

      function InitButton() {
        const dispatch = useAppAction();

        return (
          <button
            data-testid="init"
            onClick={() => dispatch('initialize', { userId: 'user123' })}
          >
            Initialize
          </button>
        );
      }

      const TestApp = () => (
        <AppActionProvider>
          <HighPriorityHandler />
          <LowPriorityHandler />
          <InitButton />
        </AppActionProvider>
      );

      const { getByTestId } = render(<TestApp />);
      fireEvent.click(getByTestId('init'));

      await waitFor(() => {
        expect(executionOrder).toEqual([
          'high-priority: user123',
          'low-priority: user123'
        ]);
      });
    }
```

**주요 포인트:**
- Context Provider를 사용한 컴포넌트 래핑
- 액션 핸들러를 통한 비즈니스 로직 분리
- 타입 안전한 액션 디스패칭
- 비동기 처리 지원
- TypeScript 인터페이스를 통한 타입 안전성
- React 성능 최적화 패턴 적용

**테스트 위치:** [`createActionContext.usage.test.tsx`](https://github.com/mineclover/context-action/blob/main/packages/react/__tests__/createActionContext.usage.test.tsx) (줄 101)

---


## 🔍 문서 검증

이 문서의 모든 예제는 실제 테스트 코드에서 추출되었으며, CI/CD 파이프라인을 통해 지속적으로 검증됩니다.

**검증 명령어:**
```bash
# 전체 문서 예제 검증
pnpm docs:validate-docs

# Enhanced 문서 재생성
pnpm docs:enhanced --packages react

# 검증과 함께 문서 생성
pnpm docs:enhanced-with-validation
```

**관련 파일:**
- [`createActionContext.usage.test.tsx`](../../../packages/react/__tests__/createActionContext.usage.test.tsx) - 사용법 예제 테스트
- [`createActionContext.test.tsx`](../../../packages/react/__tests__/actions/createActionContext.test.tsx) - API 정확성 테스트


---

## 📊 문서 메타데이터

### 예제 통계
- **총 예제 수:** 2개
- **카테고리 수:** 2개
- **우선순위별:**
  - 🔴 High: 1개
  - 🟡 Medium: 1개
  - 🟢 Low: 0개

### 생성 정보
- **최종 업데이트:** 2025-09-21
- **자동 생성:** ✅
- **검증 상태:** ✅
- **동기화 상태:** ✅



---

> 💡 **참고**: 이 문서를 수정하려면 해당 테스트 파일의 어노테이션을 수정하고 `pnpm docs:enhanced --packages react`를 실행하세요.

> 🔧 **생성 도구**: [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)
