# Ref 시스템 문제

## 개요

Ref 컨텍스트, DOM 조작 및 엘리먼트 관리 관련 문제 해결 방법을 설명합니다.

## 일반적인 Ref 문제

### 1. Ref가 null 상태

**문제**: DOM 엘리먼트에 접근 시 ref가 null임

**해결책**:
```tsx
const { getRef } = useRefOperation();

const handleClick = async () => {
  const element = await getRef('myElement', {
    timeout: 1000, // 1초 대기
    required: true
  });

  if (element) {
    element.focus();
  }
};
```

### 2. 다중 컨텍스트에서 Ref 충돌

**문제**: 여러 Ref 컨텍스트에서 같은 이름 사용

**해결책**: 고유한 Ref 이름 사용 또는 네임스페이스 적용
```tsx
// 컴포넌트별 접두사 사용
const elementRef = useRefTarget('Component1.button');
const otherRef = useRefTarget('Component2.button');
```

### 3. 메모리 누수

**문제**: 컴포넌트 언마운트 후에도 Ref 참조가 남아있음

**해결책**:
```tsx
useEffect(() => {
  return () => {
    // Ref는 자동으로 정리되지만, 수동 정리가 필요한 경우
    refManager.clearRef('myElement');
  };
}, []);
```

### 4. 비동기 Ref 접근

**문제**: DOM 엘리먼트가 아직 마운트되지 않았을 때 접근

**해결책**: 조건부 대기 사용
```tsx
const { waitForRef } = useRefOperation();

const element = await waitForRef('dynamicElement', {
  condition: (el) => el && el.offsetWidth > 0,
  timeout: 2000
});
```

## 성능 최적화

### 1. Canvas 최적화

```tsx
// 하드웨어 가속 활성화
const canvasRef = useRefTarget('canvas');

useEffect(() => {
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
  }
}, []);
```

### 2. 싱글톤 Ref 처리

```tsx
// 전역적으로 하나만 존재해야 하는 엘리먼트
const { ensureSingleton } = useRefOperation();

const modalRef = ensureSingleton('globalModal');
```

## 디버깅 팁

1. **Ref 상태 확인**: 개발자 도구에서 Ref 컨텍스트 상태 확인
2. **타이밍 문제**: 렌더링 타이밍과 Ref 접근 타이밍 동기화
3. **메모리 사용량**: 대량의 DOM 참조 시 메모리 모니터링

## 모범 사례

- Ref 이름은 컴포넌트별로 고유하게 설정
- 비동기 접근 시 항상 타임아웃 설정
- 복잡한 DOM 조작은 별도 훅으로 분리
- 성능이 중요한 경우 하드웨어 가속 활용