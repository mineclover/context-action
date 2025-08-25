# 대기-후-실행 패턴

엘리먼트 가용성을 확보한 후 안전하게 DOM 조작을 실행하는 패턴입니다.

## 전제 조건

**필수 설정**: 타입 정의, DOM 엘리먼트 ref, 그리고 프로바이더 구성을 포함한 완전한 RefContext 설정 지침은 **[RefContext 설정](../setup/ref-context-setup.md)**을 참조하세요.

이 패턴은 다음 설정 패턴을 사용하여 DOM 대기 전략을 보여줍니다:
- **타입 정의** → [DOM 엘리먼트 Ref](../setup/ref-context-setup.md#dom-element-refs)
- **컨텍스트 생성** → [기본 RefContext 설정](../setup/ref-context-setup.md#basic-refcontext-setup)
- **프로바이더 설정** → [프로바이더 설정 패턴](../setup/ref-context-setup.md#provider-setup-patterns)
- **고급 사용법** → [여러 Ref 대기](../setup/ref-context-setup.md#waiting-for-multiple-refs)

Store와 Action 통합에 대해서는 다음을 참조하세요:
- **[기본 Store 설정](../setup/basic-store-setup.md)** - 상태 관리를 위한 Store 컨텍스트
- **[기본 Action 설정](../setup/basic-action-setup.md)** - 비즈니스 로직을 위한 Action 컨텍스트

## 기본 패턴

```typescript
const actionHandler = useCallback(async () => {
  await waitForRefs('targetElement');
  
  const element = elementRef.target;
  if (element) {
    // 안전한 DOM 조작
    element.style.transform = 'scale(1.1)';
    element.focus();
  }
}, [waitForRefs, elementRef]);
```

## 고급 예제

```typescript
const animateElement = useCallback(async () => {
  // 엘리먼트가 사용 가능해질 때까지 대기
  await waitForRefs('animationTarget');
  
  const element = animationTargetRef.target;
  if (!element) return;
  
  // 애니메이션 시퀀스 적용
  element.style.transition = 'all 0.3s ease';
  element.style.transform = 'scale(1.2)';
  
  // 애니메이션 후 리셋
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 300);
}, [waitForRefs, animationTargetRef]);
```

## Store 통합 패턴

```typescript
// DOM 조작 후 Store 업데이트
const updateContentAction = useCallback(async (payload: { content: string }) => {
  // 1. DOM 엘리먼트 대기
  await waitForRefs('contentArea');
  
  const element = contentAreaRef.target;
  if (element) {
    // 2. DOM 조작 수행
    element.innerHTML = payload.content;
    element.scrollIntoView({ behavior: 'smooth' });
    
    // 3. 조작 결과로 store 업데이트
    const contentStore = stores.getStore('content');
    contentStore.setValue({
      content: payload.content,
      lastUpdated: new Date().toISOString(),
      isVisible: true
    });
  }
}, [waitForRefs, contentAreaRef, stores]);
```

## Action Handler 통합

```typescript
// 완전한 Action + Store + Ref 통합
useActionHandler('performAction', useCallback(async (payload: { content: string }) => {
  // 필요한 DOM 엘리먼트들 대기
  await waitForRefs('workArea');
  
  const workArea = workAreaRef.target;
  if (workArea) {
    // 안전한 DOM 조작
    workArea.innerHTML = payload.content;
    workArea.scrollIntoView();
    
    // 관련 store들 업데이트
    const statusStore = stores.getStore('status');
    statusStore.setValue('content-updated');
  }
}, [waitForRefs, workAreaRef, stores]));
```

## 다중 엘리먼트 조정

```typescript
const coordinateElements = useCallback(async () => {
  // 설정 패턴을 사용하여 여러 엘리먼트 대기
  const elements = await waitForRefs('sourceElement', 'targetElement', 'statusElement');
  
  const { sourceElement, targetElement, statusElement } = elements;
  
  if (sourceElement && targetElement && statusElement) {
    // 엘리먼트 간 안전한 조정
    const sourceData = sourceElement.dataset.value;
    targetElement.textContent = `Received: ${sourceData}`;
    statusElement.classList.add('success');
    
    // 조정 상태 업데이트
    const coordinationStore = stores.getStore('coordination');
    coordinationStore.setValue({
      sourceValue: sourceData,
      targetUpdated: true,
      timestamp: Date.now()
    });
  }
}, [waitForRefs, stores]);
```

## 순차적 작업

```typescript
const sequentialOperations = useCallback(async () => {
  const progressStore = stores.getStore('progress');
  
  try {
    // 단계 1: 대기 및 설정
    await waitForRefs('setupElement');
    const setupEl = setupElementRef.target;
    if (setupEl) {
      setupEl.classList.add('preparing');
      progressStore.setValue({ step: 1, status: 'preparing' });
    }
    
    // 단계 2: 다음 엘리먼트 대기
    await waitForRefs('processElement');
    const processEl = processElementRef.target;
    if (processEl) {
      processEl.classList.add('active');
      progressStore.setValue({ step: 2, status: 'processing' });
    }
    
    // 단계 3: 최종 엘리먼트
    await waitForRefs('completeElement');
    const completeEl = completeElementRef.target;
    if (completeEl) {
      completeEl.classList.add('done');
      progressStore.setValue({ step: 3, status: 'completed' });
    }
  } catch (error) {
    progressStore.setValue({ step: -1, status: 'error', error: error.message });
    console.error('Sequential operations failed:', error);
  }
}, [waitForRefs, stores]);
```

## 모범 사례

1. **엘리먼트 항상 확인**: 대기 후 엘리먼트 존재 여부를 확인합니다 (RefContext 설정 패턴 준수)
2. **Store 통합**: DOM 조작 결과를 반영하기 위해 store를 업데이트합니다
3. **에러 처리**: try-catch 블록과 store 에러 상태를 구현합니다
4. **성능**: 하드웨어 가속 속성을 사용하고 store 업데이트를 배치 처리합니다
5. **정리**: RefContext 생명주기 관리에 의한 적절한 정리
6. **타입 안전성**: 모든 ref에 대해 설정 가이드 타입 정의를 사용합니다

## 설정 통합 예제

### Store 업데이트를 포함한 폼 검증

```typescript
const validateForm = useCallback(async () => {
  await waitForRefs('formElement');
  const form = formElementRef.target;
  
  if (form) {
    const isValid = validateFormData(form);
    const validationStore = stores.getStore('validation');
    validationStore.setValue({ isValid, errors: getErrors(form) });
  }
}, [waitForRefs, stores]);
```

### 진행 상황 추적을 포함한 캔버스 렌더링

```typescript
const renderChart = useCallback(async (data: ChartData) => {
  await waitForRefs('chartCanvas');
  const canvas = chartCanvasRef.target;
  
  if (canvas) {
    const ctx = canvas.getContext('2d')!;
    // 차트 렌더링
    drawChart(ctx, data);
    
    // 렌더링 상태 업데이트
    const chartStore = stores.getStore('chart');
    chartStore.setValue({ rendered: true, data, timestamp: Date.now() });
  }
}, [waitForRefs, stores]);
```

## 일반적인 사용 사례

- **폼 검증**: 폼 엘리먼트 대기 + store에 검증 상태 저장
- **애니메이션 시퀀스**: 애니메이션 조정 + store에서 애니메이션 진행 상황 추적  
- **데이터 시각화**: 캔버스/SVG 대기 + store에 렌더링 상태 및 데이터 저장
- **모달 조작**: 모달이 마운트되었는지 확인 + store에서 모달 상태 관리
- **드래그 앤 드롭**: 드롭 영역 대기 + 드래그 조작 상태 추적

## 관련 패턴

- **[RefContext 설정](../setup/ref-context-setup.md#waiting-for-multiple-refs)** - 완전한 대기 패턴
- **[캔버스 최적화](../ref/canvas-optimization.md)** - 고성능 캔버스 조작
- **[Store 통합 패턴](../store/basic-usage.md)** - DOM 조작 후 Store 업데이트