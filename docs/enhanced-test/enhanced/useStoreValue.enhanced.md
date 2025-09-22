# Use Store Value - Enhanced Documentation

> 🔄 **자동 생성된 문서**: 이 문서는 테스트 코드에서 자동 추출되었습니다.
> 최종 수정: 2025-09-21


`useStoreValue`는 스토어의 값을 구독하고 변경사항을 자동으로 감지하는 React 훅입니다.

**핵심 특징:**
- 자동 리렌더링 최적화
- 깊은 객체 비교 지원
- 고성능 업데이트 처리
- 메모리 누수 방지
## 📚 사용법 예제

### 🚀 기본 사용법

#### 🔴 스토어 값 구독 및 리렌더링 기본 패턴

```typescript
    it('should subscribe to store value and trigger re-renders on updates', async () => {
      // Create store with initial data
      const userStore = createStore('user', {
        name: 'John',
        age: 30,
        email: 'john@example.com'
      });

      interface UserData {
        name: string;
        age: number;
        email: string;
      }

      // Test component that subscribes to store
      function UserDisplay() {
        const user = useStoreValue<UserData>(userStore);

        return (
          <div>
            <span data-testid="name">{user.name}</span>
            <span data-testid="age">{user.age}</span>
            <span data-testid="email">{user.email}</span>
          </div>
        );
      }

      const { getByTestId } = render(<UserDisplay />);

      // Initial render verification
      expect(getByTestId('name')).toHaveTextContent('John');
      expect(getByTestId('age')).toHaveTextContent('30');
      expect(getByTestId('email')).toHaveTextContent('john@example.com');

      // Update store and verify re-render
      act(() => {
        userStore.setValue({
          name: 'Jane',
          age: 25,
          email: 'jane@example.com'
        });
      });

      // Wait for async update
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('name')).toHaveTextContent('Jane');
      expect(getByTestId('age')).toHaveTextContent('25');
      expect(getByTestId('email')).toHaveTextContent('jane@example.com');

      userStore.dispose();
    }
```

**주요 포인트:**
- 반응형 스토어 값 구독
- 비동기 처리 지원

**테스트 위치:** [`useStoreValue.usage.test.tsx`](https://github.com/user/context-action/blob/main/packages/react/__tests__/stores/hooks/useStoreValue.usage.test.tsx) (줄 16)

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
- [`useStoreValue.usage.test.tsx`](../../../packages/react/__tests__/stores/hooks/useStoreValue.usage.test.tsx) - 사용법 예제 테스트
- [`useStoreValue.test.tsx`](../../../packages/react/__tests__/stores/hooks/useStoreValue.test.tsx) - API 정확성 테스트


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
