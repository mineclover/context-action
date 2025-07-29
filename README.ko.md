# Context Action 모노레포

React 통합을 지원하는 타입 안전한 액션 파이프라인 관리 TypeScript 라이브러리입니다. pnpm 모노레포로 구성되어 있습니다.

## 📦 패키지

### [@context-action/core](./packages/context-action)

React 통합을 지원하는 타입 안전한 액션 파이프라인 관리를 제공하는 메인 라이브러리 패키지입니다.

```bash
npm install @context-action/core
```

**주요 기능:**
- 🔒 **타입 안전성**: 엄격한 타입 검사를 지원하는 완전한 TypeScript 지원
- ⚡ **파이프라인 시스템**: 우선순위 제어를 통한 다중 핸들러 체이닝
- 🎯 **Context 통합**: React Context와의 원활한 통합
- 🔄 **비동기 지원**: 동기 및 비동기 작업 모두 처리
- 🛡️ **에러 처리**: 내장된 에러 처리 및 중단 메커니즘
- 📦 **경량화**: 제로 의존성으로 최소 번들 크기

### [test-app](./packages/test-app)

Vite + React를 사용한 라이브러리 개발 및 테스트 환경입니다.

## 🏗️ 개발 환경 설정

### 필수 요구사항

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 설치

```bash
# pnpm이 설치되어 있지 않다면 전역 설치
npm install -g pnpm

# 의존성 설치
pnpm install
```

### 개발 명령어

```bash
# 개발 서버 시작 (테스트 앱)
pnpm dev

# 라이브러리 빌드
pnpm build

# 모든 패키지 빌드
pnpm build:all

# 테스트 실행
pnpm test

# 린팅 실행
pnpm lint

# 타입 검사
pnpm type-check

# 빌드 산출물 정리
pnpm clean
```

## 🚀 빠른 시작

1. **라이브러리 설치:**
   ```bash
   npm install @context-action/core
   ```

2. **액션 타입 정의:**
   ```typescript
   import { ActionPayloadMap } from '@context-action/core';

   interface AppActions extends ActionPayloadMap {
     increment: void;
     setCount: number;
     reset: void;
   }
   ```

3. **액션 컨텍스트 생성:**
   ```typescript
   import { createActionContext } from '@context-action/core';

   const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();
   ```

4. **컴포넌트에서 사용:**
   ```typescript
   function Counter() {
     const [count, setCount] = useState(0);
     const action = useAction();

     useActionHandler('increment', () => setCount(prev => prev + 1));
     useActionHandler('setCount', (value) => setCount(value));

     return (
       <div>
         <p>카운트: {count}</p>
         <button onClick={() => action.dispatch('increment')}>+1</button>
         <button onClick={() => action.dispatch('setCount', 10)}>10으로 설정</button>
       </div>
     );
   }
   ```

## 📁 프로젝트 구조

```
context-action/
├── packages/
│   ├── context-action/          # 메인 라이브러리 패키지
│   │   ├── src/
│   │   │   ├── core/           # 핵심 ActionRegister 로직
│   │   │   ├── react/          # React 통합
│   │   │   └── index.ts        # 메인 진입점
│   │   ├── dist/               # 빌드된 파일들
│   │   ├── README.md           # 라이브러리 문서
│   │   ├── package.json
│   │   └── tsdown.config.ts    # 빌드 설정
│   └── test-app/               # 개발 테스트 환경
│       ├── src/
│       │   ├── App.tsx         # 테스트 애플리케이션
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── pnpm-workspace.yaml         # pnpm 워크스페이스 설정
├── package.json                # 루트 package.json
└── tsconfig.json              # TypeScript 설정
```

## 🛠️ 기술 스택

- **패키지 매니저**: pnpm with workspaces
- **언어**: TypeScript 5.3+
- **번들러**: tsdown (rolldown 기반)
- **테스트 환경**: Vite + React 18
- **코드 품질**: ESLint + TypeScript strict mode

## 📝 기여하기

1. 저장소 클론
2. 의존성 설치: `pnpm install`
3. 개발 시작: `pnpm dev`
4. 변경사항 작성
5. 테스트 앱에서 변경사항 테스트
6. 라이브러리 빌드: `pnpm build`
7. Pull request 제출

## 📚 사용 예제

### 기본 사용법

```typescript
// 1. 액션 타입 정의
interface MyActions extends ActionPayloadMap {
  showNotification: { message: string; type: 'success' | 'error' };
  hideNotification: void;
  updateUser: { id: string; name: string };
}

// 2. 컨텍스트 생성
const { Provider, useAction, useActionHandler } = createActionContext<MyActions>();

// 3. 알림 컴포넌트
function NotificationManager() {
  const [notification, setNotification] = useState<string | null>(null);
  
  useActionHandler('showNotification', ({ message, type }) => {
    setNotification(`${type}: ${message}`);
    setTimeout(() => setNotification(null), 3000);
  });
  
  useActionHandler('hideNotification', () => {
    setNotification(null);
  });
  
  return notification ? <div className="notification">{notification}</div> : null;
}

// 4. 사용자 컴포넌트
function UserProfile() {
  const action = useAction();
  
  const handleSave = () => {
    action.dispatch('showNotification', { 
      message: '저장되었습니다!', 
      type: 'success' 
    });
  };
  
  return <button onClick={handleSave}>저장</button>;
}
```

### 고급 사용법

```typescript
// 우선순위가 있는 핸들러
useActionHandler('updateUser', (payload) => {
  // 검증 로직 (높은 우선순위)
  if (!payload.name.trim()) {
    controller.abort('이름은 필수입니다');
    return;
  }
}, { priority: 10 });

useActionHandler('updateUser', async (payload) => {
  // API 호출 (중간 우선순위)
  await userAPI.update(payload);
}, { priority: 5, blocking: true });

useActionHandler('updateUser', (payload) => {
  // UI 업데이트 (낮은 우선순위)
  setUser(payload);
}, { priority: 1 });
```

## 🧪 테스트

```bash
# 테스트 실행
pnpm test

# 개발 서버에서 실시간 테스트
pnpm dev
# 브라우저에서 http://localhost:3000 접속
```

## 📄 라이선스

Apache-2.0 © [mineclover](https://github.com/mineclover)

## 🔗 링크

- [Core 패키지](./packages/core) - @context-action/core (순수 TypeScript)
- [React 패키지](./packages/react) - @context-action/react (React 통합)
- [테스트 앱](./packages/test-app) - 개발 환경
- [배포 가이드](./RELEASE.md) - 배포 문서
- [이슈 트래커](https://github.com/mineclover/context-action/issues) - 버그 리포트 및 기능 요청
- [English README](./README.md) - English version

## 🙋‍♂️ 자주 묻는 질문

### Q: Redux와 어떤 차이가 있나요?
A: Context Action은 더 단순하고 타입 안전한 접근 방식을 제공합니다. Redux의 복잡한 보일러플레이트 없이도 강력한 상태 관리를 할 수 있습니다.

### Q: 성능은 어떤가요?
A: 라이브러리는 매우 경량화되어 있으며 제로 의존성을 가집니다. React Context를 기반으로 하므로 불필요한 리렌더링을 최소화합니다.

### Q: TypeScript 없이도 사용할 수 있나요?
A: 네, 하지만 TypeScript 사용을 강력히 권장합니다. 타입 안전성이 이 라이브러리의 핵심 장점 중 하나입니다.

### Q: 서버사이드 렌더링(SSR)을 지원하나요?
A: 네, Next.js와 같은 SSR 프레임워크에서 정상적으로 작동합니다.