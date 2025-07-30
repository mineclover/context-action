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

```tsx
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
  const dispatch = useAction();

  // 액션 핸들러 등록
  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('setCount', (value) => setCount(value));
  useActionHandler('reset', () => setCount(0));

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => dispatch('increment')}>+1</button>
      <button onClick={() => dispatch('setCount', 10)}>10으로 설정</button>
      <button onClick={() => dispatch('reset')}>리셋</button>
    </div>
  );
}
```


[시작하기 →](/ko/guide/getting-started)