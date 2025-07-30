---
layout: home

hero:
  name: "Context Action"
  text: "타입 안전 액션 파이프라인 관리"
  tagline: "예측 가능한 액션 처리로 강력한 React 애플리케이션 구축"
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/getting-started
    - theme: alt
      text: GitHub에서 보기
      link: https://github.com/mineclover/context-action

features:
  - icon: 🔒
    title: 타입 안전
    details: 액션과 페이로드에 대한 엄격한 타입 검사를 통한 완전한 TypeScript 지원
  - icon: ⚡
    title: 파이프라인 시스템
    details: 우선순위 제어와 비동기 지원을 통한 다중 핸들러 체이닝
  - icon: 🎯
    title: React 통합
    details: 쉬운 상태 관리를 위한 훅과 함께 React Context의 완벽한 통합
  - icon: 🔄
    title: 비동기 지원
    details: 내장된 에러 핸들링과 함께 동기 및 비동기 작업 처리
  - icon: 🛡️
    title: 에러 핸들링
    details: 견고한 애플리케이션을 위한 내장 에러 핸들링 및 중단 메커니즘
  - icon: 📦
    title: 경량화
    details: 최적의 성능을 위한 제로 의존성의 최소 번들 크기
---

## 빠른 예제

```typescript
import { createActionContext } from '@context-action/react';

// 액션 타입 정의
interface AppActions {
  increment: void;
  setCount: number;
  reset: void;
}

// 액션 컨텍스트 생성
const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();

function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  // 액션 핸들러 등록
  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('setCount', (value) => setCount(value));
  useActionHandler('reset', () => setCount(0));

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => action.dispatch('increment')}>+1</button>
      <button onClick={() => action.dispatch('setCount', 10)}>10으로 설정</button>
      <button onClick={() => action.dispatch('reset')}>리셋</button>
    </div>
  );
}
```

## 설치

::: code-group

```bash [npm]
npm install @context-action/core @context-action/react
```

```bash [pnpm]
pnpm add @context-action/core @context-action/react
```

```bash [yarn]
yarn add @context-action/core @context-action/react
```

:::

## 왜 Context Action인가?

- **🎯 예측 가능**: 명확한 순서로 예측 가능한 파이프라인을 통해 액션이 흐릅니다
- **🔧 유연함**: 우선순위 기반 핸들러 시스템이 애플리케이션 요구사항에 적응합니다
- **⚡ 성능**: 최소한의 오버헤드와 최대 처리량을 위해 최적화되었습니다
- **🧪 테스트 가능**: 관심사의 명확한 분리로 테스트가 간단합니다
- **📚 개발자 친화적**: 뛰어난 TypeScript 지원과 포괄적인 문서화

[시작하기 →](/ko/guide/getting-started)