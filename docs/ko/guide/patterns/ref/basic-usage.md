# Ref 기본 사용법

타입 안전 ref 관리와 리렌더링 없는 기본 RefContext 패턴입니다.

## 가져오기
```typescript
import { createRefContext } from '@context-action/react';
```

## 기능
- ✅ DOM 조작 시 React 리렌더링 없음
- ✅ 하드웨어 가속 변환
- ✅ 타입 안전 ref 관리
- ✅ 자동 라이프사이클 관리
- ✅ 완벽한 관심사 분리
- ✅ 자동 정리를 통한 메모리 효율성

## 선행 요건

**필수 읽기**: **[RefContext 설정 가이드](../setup/ref-context-setup.md)**

이 문서는 표준화된 설정 패턴을 사용하여 사용 패턴을 보여줍니다:
- **타입 정의** → [DOM 요소 Refs](../setup/ref-context-setup.md#dom-element-refs)
- **컨텍스트 생성** → [기본 RefContext 설정](../setup/ref-context-setup.md#basic-refcontext-setup)
- **프로바이더 설정** → [단일 RefContext 프로바이더](../setup/ref-context-setup.md#single-refcontext-provider)
- **초기화 패턴** → [지연 초기화](../setup/ref-context-setup.md#lazy-initialization)

## 설정 패턴

### 기본 설정

```typescript
import { createRefContext } from '@context-action/react';

// 설정 가이드의 UIRefs 패턴 사용
const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef,
  useWaitForRefs
} = createRefContext<UIRefs>('UI');
```

### 프로바이더 통합

```typescript
function App() {
  return (
    <UIRefProvider>
      <YourComponents />
    </UIRefProvider>
  );
}
```

### Ref 등록

```typescript
function MyComponent() {
  const modalRef = useUIRef('modal');
  const dropdownRef = useUIRef('dropdown');
  
  return <div ref={modalRef.setRef}>모달 요소</div>;
}
```

## 기본 사용 예제

```tsx
// 1. 설정 가이드에서 UIRefs 가져오기
import { createRefContext } from '@context-action/react';

// 설정 사양의 UIRefs
interface UIRefs {
  modal: HTMLDialogElement;
  dropdown: HTMLDivElement;
  tooltip: HTMLSpanElement;
  sidebar: HTMLElement;
}

// 2. 이름 변경 패턴으로 RefContext 생성
const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef
} = createRefContext<UIRefs>('UI');

// 3. 프로바이더 설정
function App() {
  return (
    <UIRefProvider>
      <InteractiveUI />
    </UIRefProvider>
  );
}

// 4. 직접 DOM 조작을 하는 컴포넌트
function InteractiveUI() {
  const modal = useUIRef('modal');
  const dropdown = useUIRef('dropdown');
  const tooltip = useUIRef('tooltip');
  
  // 직접 DOM 조작 - React 리렌더링 없음!
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tooltip.target) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // 하드웨어 가속 변환
    tooltip.target.style.transform = `translate3d(${x + 10}px, ${y - 10}px, 0)`;
    tooltip.target.style.opacity = '1';
  }, [tooltip]);
  
  const handleMouseLeave = useCallback(() => {
    if (!tooltip.target) return;
    tooltip.target.style.opacity = '0';
  }, [tooltip]);
  
  const toggleDropdown = useCallback(() => {
    if (!dropdown.target) return;
    
    // 리렌더링 없는 직접 DOM 조작
    const isOpen = dropdown.target.classList.contains('open');
    if (isOpen) {
      dropdown.target.style.transform = 'translateY(-10px)';
      dropdown.target.style.opacity = '0';
      setTimeout(() => dropdown.target?.classList.remove('open'), 150);
    } else {
      dropdown.target.classList.add('open');
      dropdown.target.style.transform = 'translateY(0)';
      dropdown.target.style.opacity = '1';
    }
  }, [dropdown]);
  
  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-96 bg-gray-100 p-4"
    >
      <button
        onClick={toggleDropdown}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        드롭다운 토글
      </button>
      
      <div
        ref={dropdown.setRef}
        className="absolute top-12 left-0 bg-white shadow-lg rounded-md p-4 opacity-0 transform -translate-y-2 transition-all duration-150"
        style={{ transform: 'translateY(-10px)', opacity: 0 }}
      >
        <div className="space-y-2">
          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">옵션 1</div>
          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">옵션 2</div>
          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">옵션 3</div>
        </div>
      </div>
      
      <span
        ref={tooltip.setRef}
        className="fixed bg-black text-white px-2 py-1 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
        인터랙티브 툴팁
      </span>
    </div>
  );
}
```

## 커스텀 훅 패턴

```tsx
// UI 상호작용 비즈니스 로직을 위한 커스텀 훅
function useUIInteractionManager() {
  const modal = useUIRef('modal');
  const tooltip = useUIRef('tooltip');
  const sidebar = useUIRef('sidebar');
  const interactionHistory = useRef<Array<{type: string, timestamp: number}>>([]);
  
  const showModal = useCallback((content: string) => {
    if (!modal.target) return;
    
    // 리렌더링 없는 직접 DOM 조작
    modal.target.innerHTML = content;
    modal.target.style.transform = 'scale(0.9)';
    modal.target.style.opacity = '0';
    modal.target.showModal();
    
    // 애니메이션 인
    setTimeout(() => {
      if (modal.target) {
        modal.target.style.transform = 'scale(1)';
        modal.target.style.opacity = '1';
        modal.target.style.transition = 'all 0.3s ease-out';
      }
    }, 10);
    
    // 상호작용 추적
    interactionHistory.current.push({ type: 'modal_opened', timestamp: Date.now() });
  }, [modal]);
  
  const hideModal = useCallback(() => {
    if (!modal.target) return;
    
    modal.target.style.transform = 'scale(0.9)';
    modal.target.style.opacity = '0';
    
    setTimeout(() => {
      modal.target?.close();
    }, 300);
    
    interactionHistory.current.push({ type: 'modal_closed', timestamp: Date.now() });
  }, [modal]);
  
  const updateTooltip = useCallback((text: string, x: number, y: number) => {
    if (!tooltip.target) return;
    
    tooltip.target.textContent = text;
    tooltip.target.style.transform = `translate3d(${x + 10}px, ${y - 10}px, 0)`;
    tooltip.target.style.opacity = '1';
  }, [tooltip]);
  
  const toggleSidebar = useCallback((isOpen: boolean) => {
    if (!sidebar.target) return;
    
    sidebar.target.style.transform = isOpen 
      ? 'translateX(0)' 
      : 'translateX(-100%)';
    sidebar.target.style.transition = 'transform 0.3s ease-in-out';
    
    interactionHistory.current.push({ 
      type: isOpen ? 'sidebar_opened' : 'sidebar_closed', 
      timestamp: Date.now() 
    });
  }, [sidebar]);
  
  const getInteractionStats = useCallback(() => {
    const recent = interactionHistory.current.filter(
      interaction => Date.now() - interaction.timestamp < 60000 // 지난 1분
    );
    return {
      total: interactionHistory.current.length,
      recent: recent.length,
      types: [...new Set(recent.map(i => i.type))]
    };
  }, []);
  
  return { 
    showModal, 
    hideModal, 
    updateTooltip, 
    toggleSidebar, 
    getInteractionStats 
  };
}

// 컴포넌트에서 사용
function AdvancedUIManager() {
  const { showModal, hideModal, updateTooltip, toggleSidebar, getInteractionStats } = useUIInteractionManager();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleShowModal = useCallback(() => {
    showModal('<h2>동적 콘텐츠</h2><p>이 모달은 React 리렌더링 없이 채워졌습니다!</p>');
  }, [showModal]);
  
  const handleToggleSidebar = useCallback(() => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    toggleSidebar(newState);
  }, [sidebarOpen, toggleSidebar]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updateTooltip('직접 DOM 조작으로 업데이트된 호버 툴팁', e.clientX, e.clientY);
  }, [updateTooltip]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = getInteractionStats();
      console.log('UI 상호작용 통계:', stats);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [getInteractionStats]);
  
  return (
    <div 
      onMouseMove={handleMouseMove}
      className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 p-4"
    >
      <div className="space-x-4">
        <button 
          onClick={handleShowModal}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          모달 표시
        </button>
        <button 
          onClick={handleToggleSidebar}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          사이드바 토글
        </button>
      </div>
    </div>
  );
}
```

## 사용 가능한 훅
- `useRefHandler(name)` - 이름으로 타입화된 ref 핸들러 가져오기
- `useWaitForRefs()` - 여러 ref가 마운트되기까지 대기
- `useGetAllRefs()` - 모든 마운트된 ref 액세스
- `refHandler.setRef` - ref 콜백 설정
- `refHandler.target` - 현재 ref 값 액세스
- `refHandler.isMounted` - 마운트 상태 확인
- `refHandler.waitForMount()` - 비동기 ref 대기
- `refHandler.withTarget()` - 안전한 작업

## 실제 사례

### 코드베이스의 라이브 예제
- **[RefContext 마우스 이벤트 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/RefContextMouseEventsPage.tsx)** - RefContext를 사용한 완전한 마우스 추적
- **[캔버스 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/CanvasRefDemoPage.tsx)** - 직접 DOM 조작을 사용한 캔버스 그리기
- **[폼 빌더 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/FormBuilderRefDemoPage.tsx)** - ref를 사용한 동적 폼 빌더
- **[요소 관리 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/ElementManagementPage.tsx)** - 복잡한 요소 관리
- **[비주얼 이펙트 컨텍스트](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/VisualEffectsRefContext.tsx)** - RefContext를 사용한 비주얼 이펙트
- **[성능 컨텍스트](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/PerformanceRefContext.tsx)** - ref를 사용한 성능 모니터링

## 모범 사례

1. **하드웨어 가속**: GPU 가속 애니메이션을 위해 `translate3d()` 사용
2. **React 리렌더링 방지**: DOM 조작을 React 렌더링 사이클 밖에서 유지
3. **관심사 분리**: 비즈니스 로직을 위해 커스텀 훅 사용
4. **타입 안전성**: 적절한 HTML 요소 타입으로 명확한 ref 타입 인터페이스 정의
5. **성능 우선**: 편의성보다 60fps 성능 우선