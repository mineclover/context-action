# Create Store Context - Enhanced Documentation

> 🔄 **자동 생성된 문서**: 이 문서는 테스트 코드에서 자동 추출되었습니다.
> 최종 수정: 2025-09-21


`createStoreContext`는 선언적 스토어 패턴을 구현하기 위한 Context를 생성합니다.

**핵심 특징:**
- 타입 추론 자동화
- 복수 스토어 관리
- Provider 자동 생성
- 최적화된 구독 시스템
## 📚 사용법 예제

### 🚀 기본 사용법

#### 🔴 자동 타입 추론을 통한 스토어 컨텍스트 생성

```typescript
    it('should create store context with automatic type inference', async () => {
      // Create store context with initial values
      const {
        Provider: AppStoreProvider,
        useStore: useAppStore
      } = createStoreContext('App', {
        user: { name: 'John', isLoggedIn: false },
        settings: { theme: 'light', language: 'en' },
        cart: { items: [], total: 0 }
      });

      // Test component that uses multiple stores
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

      function CartSummary() {
        const cartStore = useAppStore('cart');
        const cart = useStoreValue(cartStore);

        return (
          <div data-testid="cart">
            Items: {cart.items.length}, Total: ${cart.total}
          </div>
        );
      }

      function App() {
        return (
          <AppStoreProvider>
            <UserInfo />
            <ThemeDisplay />
            <CartSummary />
          </AppStoreProvider>
        );
      }

      const { getByTestId } = render(<App />);

      expect(getByTestId('user-info')).toHaveTextContent('John - Logged Out');
      expect(getByTestId('theme')).toHaveTextContent('light');
      expect(getByTestId('cart')).toHaveTextContent('Items: 0, Total: $0');
    }
```

**주요 포인트:**
- Context Provider를 사용한 컴포넌트 래핑
- 반응형 스토어 값 구독
- 비동기 처리 지원

**테스트 위치:** [`createStoreContext.usage.test.tsx`](https://github.com/mineclover/context-action/blob/main/packages/react/__tests__/stores/patterns/createStoreContext.usage.test.tsx) (줄 8)

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
- [`createStoreContext.usage.test.tsx`](../../../packages/react/__tests__/stores/patterns/createStoreContext.usage.test.tsx) - 사용법 예제 테스트
- [`createDeclarativeStorePattern.test.tsx`](../../../packages/react/__tests__/stores/patterns/createDeclarativeStorePattern.test.tsx) - API 정확성 테스트


---

## 📊 문서 메타데이터

### 예제 통계
- **총 예제 수:** 1개
- **카테고리 수:** 1개
- **우선순위별:**
  - 🔴 High: 1개
  - 🟡 Medium: 0개
  - 🟢 Low: 0개

### 생성 정보
- **최종 업데이트:** 2025-09-21
- **자동 생성:** ✅
- **검증 상태:** ✅
- **동기화 상태:** ✅



---

> 💡 **참고**: 이 문서를 수정하려면 해당 테스트 파일의 어노테이션을 수정하고 `pnpm docs:enhanced --packages react`를 실행하세요.

> 🔧 **생성 도구**: [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)
