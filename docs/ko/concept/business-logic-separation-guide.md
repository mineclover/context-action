# 비즈니스 로직 분리 가이드

이 가이드는 Context-Action 프레임워크에서 UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 패턴을 보여줍니다.

> **관련 문서:**
> - [Store 컨벤션](./store-conventions.md) - Store 타입과 사용 패턴
> - [컨벤션](./conventions.md) - 전체 코딩 컨벤션
> - [Action Pipeline 가이드](./action-pipeline-guide.md) - Action handler 패턴

## 비즈니스 로직 분리

### 개요

UI 컴포넌트와 상태 관리로부터 비즈니스 로직을 분리하는 것은 유지보수성, 테스트 가능성, 확장성에 매우 중요합니다. Context-Action 프레임워크는 비동기 프로세스 상태 관리와 함께 모듈화된 비즈니스 로직 패턴을 통해 이를 지원합니다.

### 핵심 원칙

1. **순수 비즈니스 로직**: 비즈니스 로직은 React와 store 구현으로부터 독립적이어야 함
2. **상태 머신**: 복잡한 비동기 프로세스를 위한 명시적 상태 전이 사용
3. **진행률 분리**: `notifyPath`를 사용하여 상태 변경과 진행률 업데이트 분리
4. **모듈화 설계**: 비즈니스 로직 모듈은 UI 없이 테스트 가능해야 함

### 패턴 1: 비즈니스 로직 모듈

React/store로부터 독립적인 순수 비즈니스 로직 클래스 또는 함수 생성:

```typescript
// ✅ 순수 비즈니스 로직 모듈
class FileUploadService {
  /**
   * 파일 검증 (순수 함수)
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: '파일이 너무 큽니다' };
    }
    return { valid: true };
  }

  /**
   * 진행률 콜백과 함께 업로드
   */
  async uploadFile(
    file: File,
    onProgress: (progress: number) => void
  ): Promise<{ fileId: string }> {
    // 진행률 추적과 함께 업로드 구현
    for (let i = 0; i <= 100; i += 10) {
      await delay(100);
      onProgress(i);
    }
    return { fileId: `file_${Date.now()}` };
  }

  /**
   * 완전한 워크플로우 오케스트레이션
   */
  async completeUpload(
    file: File,
    callbacks: {
      onStateChange: (state: ProcessState) => void;
      onProgress: (progress: number) => void;
    }
  ): Promise<UploadResult> {
    try {
      callbacks.onStateChange('validating');
      const validation = this.validateFile(file);
      if (!validation.valid) {
        callbacks.onStateChange('error');
        return { success: false, error: validation.error };
      }

      callbacks.onStateChange('uploading');
      const { fileId } = await this.uploadFile(file, callbacks.onProgress);

      callbacks.onStateChange('complete');
      return { success: true, fileId };
    } catch (error) {
      callbacks.onStateChange('error');
      return { success: false, error: error.message };
    }
  }
}
```

**장점**:
- ✅ React나 store 없이 테스트 가능
- ✅ 다양한 UI 프레임워크에서 재사용 가능
- ✅ 명확한 관심사 분리
- ✅ 쉬운 모킹과 테스트

**테스트 참조**: `packages/react/__tests__/stores/notifyPath-async-process.test.tsx` 참조
- `describe('Business Logic Separation')` - 의존성 없는 순수 비즈니스 로직
- `FileUploadService` 클래스 구현

### 패턴 2: 비동기 프로세스 상태 머신

복잡한 비동기 워크플로우를 위한 명시적 상태 타입과 전이 사용:

```typescript
// 상태 머신 타입
type ProcessState =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

// 상태 머신을 가진 Store
const processStore = createTimeTravelStore('process', {
  state: 'idle' as ProcessState,
  progress: { percentage: 0, bytesUploaded: 0, totalBytes: 0 },
  error: null as string | null,
  result: null as UploadResult | null
}, { mutable: true });

// notifyPath를 사용한 상태 전이
async function executeUpload(file: File) {
  const uploadService = new FileUploadService();

  await uploadService.completeUpload(file, {
    // 상태 전이 (notifyPath만)
    onStateChange: (state) => {
      const current = processStore.getValue();
      current.state = state;
      processStore.notifyPath(['state']);
    },

    // 진행률 업데이트 (notifyPath만)
    onProgress: (percentage) => {
      const current = processStore.getValue();
      current.progress.percentage = percentage;
      processStore.notifyPath(['progress', 'percentage']);
    }
  });
}
```

**상태 머신 장점**:
- ✅ 명시적 상태 전이
- ✅ 워크플로우 시각화 용이
- ✅ 잘못된 상태 방지
- ✅ 디버깅 촉진

**테스트 참조**: `packages/react/__tests__/stores/notifyPath-async-process.test.tsx` 참조
- `describe('Async Process State Machine')` - notifyPath를 사용한 상태 머신 패턴
- `it('proves state machine pattern with notifyPath for state-only updates')` - 전체 워크플로우 테스트

### 패턴 3: 진행률 전용 업데이트

최대 성능을 위해 진행률 업데이트와 상태 변경 분리:

```typescript
const uploadStore = createTimeTravelStore('upload', {
  state: 'uploading' as ProcessState,
  progress: { current: 0, total: 100 },
  file: null as File | null
}, { mutable: true });

// 컴포넌트가 특정 경로 구독
function UploadProgress() {
  // 진행률 변경 시에만 재렌더링
  const progress = useStorePath(uploadStore, ['progress']);
  return <ProgressBar value={progress.current} max={progress.total} />;
}

function UploadState() {
  // 상태 변경 시에만 재렌더링
  const state = useStorePath(uploadStore, ['state']);
  return <StatusText state={state} />;
}

// 상태 재렌더링 트리거 없이 진행률 업데이트
function updateProgress(current: number) {
  const store = uploadStore.getValue();
  store.progress.current = current;
  // UploadProgress 컴포넌트만 재렌더링
  uploadStore.notifyPath(['progress', 'current']);
}

// 진행률 재렌더링 트리거 없이 상태 업데이트
function updateState(newState: ProcessState) {
  const store = uploadStore.getValue();
  store.state = newState;
  // UploadState 컴포넌트만 재렌더링
  uploadStore.notifyPath(['state']);
}
```

**진행률 분리 장점**:
- ✅ 100% 재렌더링 효율성 (낭비되는 렌더링 없음)
- ✅ 성능 비용 없는 고빈도 업데이트
- ✅ 독립적 컴포넌트 구독
- ✅ 진행률 바, 로딩 표시기에 최적

**테스트 참조**: `packages/react/__tests__/stores/notifyPath-async-process.test.tsx` 참조
- `describe('Async Process State Machine')` - 진행률 전용 업데이트 테스트
- `it('proves progress-only updates do not trigger state re-renders')` - 10번 진행률 업데이트, 0번 상태 렌더링

### 패턴 4: 모듈화 통합

명확한 경계를 가진 비즈니스 로직, 상태 관리, UI 통합:

```typescript
// 1. 비즈니스 로직 레이어 (의존성 없음)
const uploadService = new FileUploadService();

// 2. 상태 관리 레이어
const uploadFlowStore = createTimeTravelStore('uploadFlow', {
  files: [] as Array<{ id: string; state: ProcessState; progress: number }>,
  activeUpload: null as { fileId: string; state: ProcessState } | null
}, { mutable: true });

// 3. 오케스트레이션 레이어 (비즈니스 로직 + 상태 연결)
async function processUploadQueue(files: File[]) {
  const state = uploadFlowStore.getValue();

  for (const file of files) {
    const fileId = `file_${Date.now()}`;

    // 큐에 추가
    state.files.push({ id: fileId, state: 'idle', progress: 0 });
    uploadFlowStore.notifyPath(['files']);

    // 활성화 설정
    state.activeUpload = { fileId, state: 'uploading' };
    uploadFlowStore.notifyPath(['activeUpload']);

    // 비즈니스 로직 실행
    await uploadService.completeUpload(file, {
      onStateChange: (uploadState) => {
        const current = uploadFlowStore.getValue();
        if (current.activeUpload) {
          current.activeUpload.state = uploadState;
          uploadFlowStore.notifyPath(['activeUpload', 'state']);
        }
      },
      onProgress: (percentage) => {
        const current = uploadFlowStore.getValue();
        const fileIndex = current.files.findIndex(f => f.id === fileId);
        if (fileIndex >= 0) {
          current.files[fileIndex].progress = percentage;
          uploadFlowStore.notifyPath(['files', fileIndex, 'progress']);
        }
      }
    });

    // 완료
    state.activeUpload = null;
    uploadFlowStore.notifyPath(['activeUpload']);
  }
}

// 4. UI 레이어 (순수 표현)
function UploadQueue() {
  const files = useStorePath(uploadFlowStore, ['files']);
  return (
    <div>
      {files.map(file => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  );
}

function FileItem({ file }) {
  return (
    <div>
      <span>{file.state}</span>
      <ProgressBar value={file.progress} />
    </div>
  );
}
```

**통합 장점**:
- ✅ 비즈니스 로직 독립적 테스트 가능
- ✅ 비즈니스 로직과 상태 관리 분리
- ✅ UI 컴포넌트는 순수 표현
- ✅ 명확한 관심사 분리
- ✅ 각 레이어 독립적 테스트 가능

**테스트 참조**: `packages/react/__tests__/stores/notifyPath-async-process.test.tsx` 참조
- `describe('Modular Business Logic Integration')` - 완전한 통합 테스트
- `it('proves integration of business logic, state management, and selective rendering')` - 전체 레이어 분리 증명

### 패턴 5: 상태 머신을 통한 에러 핸들링

명시적 상태 전이를 통한 에러 처리:

```typescript
const errorStore = createTimeTravelStore('error', {
  state: 'idle' as ProcessState,
  error: null as { code: string; message: string } | null,
  retryCount: 0,
  maxRetries: 3
}, { mutable: true });

async function executeWithErrorHandling(operation: () => Promise<void>) {
  const state = errorStore.getValue();

  try {
    state.state = 'processing';
    state.error = null;
    errorStore.notifyPaths([['state'], ['error']]);

    await operation();

    state.state = 'complete';
    state.retryCount = 0;
    errorStore.notifyPaths([['state'], ['retryCount']]);

  } catch (error) {
    state.state = 'error';
    state.error = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message
    };
    state.retryCount++;

    errorStore.notifyPaths([
      ['state'],
      ['error'],
      ['retryCount']
    ]);

    // 자동 재시도 로직
    if (state.retryCount < state.maxRetries) {
      await delay(1000 * state.retryCount); // 지수 백오프
      await executeWithErrorHandling(operation);
    }
  }
}
```

**에러 핸들링 장점**:
- ✅ 명시적 에러 상태
- ✅ 백오프를 사용한 재시도 로직
- ✅ 에러 세부 정보 추적
- ✅ 명확한 실패 복구 경로

**테스트 참조**: `packages/react/__tests__/stores/notifyPath-async-process.test.tsx` 참조
- `describe('Error Handling with State Machine')` - 에러 상태 관리 테스트
- `it('proves error state management with notifyPath')` - 검증 에러 핸들링

### 패턴 6: 다중 파일 큐 관리

여러 동시 작업이 있는 복잡한 워크플로우:

```typescript
const queueStore = createTimeTravelStore('queue', {
  queue: [] as Array<{
    id: string;
    state: ProcessState;
    progress: number;
    error: string | null;
  }>,
  processing: false,
  currentIndex: -1,
  completedCount: 0,
  failedCount: 0
}, { mutable: true });

async function processQueue(files: File[]) {
  const state = queueStore.getValue();

  // 큐 초기화
  state.queue = files.map((file, i) => ({
    id: `file_${i}`,
    state: 'idle' as ProcessState,
    progress: 0,
    error: null
  }));
  state.processing = true;
  queueStore.notifyPaths([['queue'], ['processing']]);

  // 각 파일 처리
  for (let i = 0; i < files.length; i++) {
    state.currentIndex = i;
    state.queue[i].state = 'uploading';
    queueStore.notifyPaths([
      ['currentIndex'],
      ['queue', i, 'state']
    ]);

    try {
      await uploadService.uploadFile(files[i], (progress) => {
        // 진행률 전용 업데이트
        state.queue[i].progress = progress;
        queueStore.notifyPath(['queue', i, 'progress']);
      });

      state.queue[i].state = 'complete';
      state.completedCount++;
      queueStore.notifyPaths([
        ['queue', i, 'state'],
        ['completedCount']
      ]);

    } catch (error) {
      state.queue[i].state = 'error';
      state.queue[i].error = error.message;
      state.failedCount++;
      queueStore.notifyPaths([
        ['queue', i, 'state'],
        ['queue', i, 'error'],
        ['failedCount']
      ]);
    }
  }

  state.processing = false;
  state.currentIndex = -1;
  queueStore.notifyPaths([['processing'], ['currentIndex']]);
}
```

**큐 관리 장점**:
- ✅ 항목별 상태 추적
- ✅ 선택적 경로 업데이트
- ✅ `notifyPaths`를 사용한 배치 알림
- ✅ 불필요한 재렌더링 없음
- ✅ 전역 큐 상태 추적

**테스트 참조**: `packages/react/__tests__/stores/notifyPath-async-process.test.tsx` 참조
- `describe('Complex Workflow: Multi-file Upload Queue')` - 큐 관리 테스트
- `it('proves complex async workflow with queue management')` - 3개 파일, 각 5번 진행률 업데이트

### 비즈니스 로직 테스트

```typescript
// React나 store 없이 비즈니스 로직 테스트
describe('FileUploadService', () => {
  it('validates file size', () => {
    const service = new FileUploadService();
    const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'huge.pdf');

    const result = service.validateFile(largeFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('uploads with progress tracking', async () => {
    const service = new FileUploadService();
    const file = new File(['content'], 'test.pdf');
    const progressUpdates: number[] = [];

    await service.uploadFile(file, (progress) => {
      progressUpdates.push(progress);
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });
});
```

### 성능 특성

**전통적인 setValue 접근 방식**:
```typescript
// ❌ 단일 작업에 여러 재렌더링
store.setValue({ ...state, loading: true });    // 재렌더 1
store.setValue({ ...state, progress: 50 });     // 재렌더 2
store.setValue({ ...state, loading: false });   // 재렌더 3
// 총: 3번 재렌더링
```

**최적화된 notifyPath 접근 방식**:
```typescript
// ✅ 선택적 업데이트, 최소 재렌더링
state.loading = true;
store.notifyPath(['loading']);                  // 알림만

state.progress = 50;
store.notifyPath(['progress']);                 // 진행률 업데이트만

state.loading = false;
store.setValue(state);                          // 최종 재렌더링
// 총: 1번 재렌더링 + 2번 선택적 알림
```

### 베스트 프랙티스 요약

1. **비즈니스 로직 분리**: 비즈니스 로직을 React/store와 독립적으로 유지
2. **상태 머신 사용**: 복잡한 비동기 워크플로우를 위한 명시적 상태
3. **진행률 분리**: 상태 변경 없이 진행률을 위해 `notifyPath` 사용
4. **경로 기반 구독**: 선택적 재렌더링을 위해 `useStorePath` 사용
5. **배치 업데이트**: 여러 경로 업데이트를 위해 `notifyPaths` 사용
6. **독립적 테스트**: UI 의존성 없이 비즈니스 로직 유닛 테스트
7. **명확한 경계**: 비즈니스 → 상태 → UI 레이어 분리
8. **에러 상태**: 상태 머신을 통한 명시적 에러 핸들링

### 관련 문서

**성능 & 테스팅**:
- [Performance Proof](./notifyPath-performance-proof.md) - 수학적 성능 증명 (50% 재렌더링 감소, RAF 배칭 등)
- [Async Process Tests](../../packages/react/__tests__/stores/notifyPath-async-process.test.tsx) - 6개 테스트 카테고리의 종합 테스트 스위트:
  - Business Logic Separation - 의존성 없는 순수 비즈니스 로직
  - Async Process State Machine - notifyPath를 사용한 상태 전이
  - Progress-Only Updates - 선택적 재렌더링 증명
  - Modular Business Logic Integration - 전체 레이어 분리
  - Error Handling - 검증 및 에러 상태
  - Multi-file Queue Management - 복잡한 동시 워크플로우
- [Performance Tests](../../packages/react/__tests__/stores/notifyPath-performance.test.tsx) - 재렌더링 감소, RAF 배칭, 선택적 렌더링 벤치마크

**아키텍처 & 패턴**:
- [Event Loop Control](#event-loop-control) - Action Handler 및 RefContext와의 통합 패턴
- [Main Conventions](./conventions.md) - 전체 프레임워크 컨벤션
- [Hooks Reference](./hooks-reference.md) - 완전한 hooks 문서

---
