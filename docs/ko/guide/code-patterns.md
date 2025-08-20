# 코드 패턴

Context-Action 프레임워크의 RefContext와 useWaitForRefs 핵심 기능 패턴입니다.

자세한 예제와 구현 가이드라인은 정리된 패턴 모음을 참조하세요:

## 📁 [패턴 모음](./patterns/)

### 핵심 패턴
- **[RefContext 설정](./patterns/ref-context-setup.md)** - TypeScript 타입을 포함한 기본 설정
- **[조건부 대기](./patterns/conditional-await.md)** - 핵심 useWaitForRefs 동작
- **[대기 후 실행](./patterns/wait-then-execute.md)** - 안전한 DOM 조작
- **[실시간 상태 접근](./patterns/real-time-state-access.md)** - 클로저 함정 방지
- **[타임아웃 보호](./patterns/timeout-protection.md)** - 무한 대기 방지

## 빠른 참조

### 필수 규칙

#### ✅ 해야 할 것
- useWaitForRefs가 포함된 핸들러에서 `useCallback` 사용
- `store.getValue()`로 실시간 상태 접근
- try-catch로 에러 처리
- 마운트/언마운트 시나리오 모두 테스트

#### ❌ 하지 말 것
- 직접 DOM 쿼리 사용 (`document.getElementById`)
- 핸들러에서 컴포넌트 스코프 값에 의존
- 에러 처리 무시
- 중요한 경로에서 타임아웃 보호 생략