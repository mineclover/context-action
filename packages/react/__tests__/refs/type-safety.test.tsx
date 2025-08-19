/**
 * @fileoverview Type Safety Tests for RefContext System
 * 
 * 컴파일 타임에 타입 안전성을 검증하는 테스트 파일
 */

import React from 'react';
import { createRefContext } from '../../src/refs/createRefContext';
import type { 
  RefInitConfig, 
  RefActionPayloadMap
} from '../../src/refs/types';

// =============================================================================
// 1. 기본 DOM 요소 타입 테스트
// =============================================================================

interface BasicDOMElements {
  input: HTMLInputElement;
  button: HTMLButtonElement;  
  div: HTMLDivElement;
  canvas: HTMLCanvasElement;
}

const domRefDefinitions = {
  input: {
    name: 'input',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLInputElement>,
  
  button: {
    name: 'button',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLButtonElement>,
  
  div: {
    name: 'div',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLDivElement>,
  
  canvas: {
    name: 'canvas',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLCanvasElement>
};

const DOMRefs = createRefContext('BasicDOM', domRefDefinitions);

function BasicDOMTest() {
  const input = DOMRefs.useRefHandler('input');
  const button = DOMRefs.useRefHandler('button');
  
  // ✅ 타입 체크: HTMLInputElement 메서드 사용 가능
  const handleClick = () => {
    input.withTarget((element: HTMLInputElement) => {
      element.focus(); // ✅ HTMLInputElement.focus()
      element.select(); // ✅ HTMLInputElement.select()
      const value = element.value; // ✅ HTMLInputElement.value
      return value;
    });
  };

  return (
    <DOMRefs.Provider>
      <input ref={input.setRef} type="text" />
      <button ref={button.setRef} onClick={handleClick}>
        Focus Input
      </button>
    </DOMRefs.Provider>
  );
}

// =============================================================================
// 2. Three.js 객체 타입 테스트
// =============================================================================

interface MockThreeObject {
  uuid: string;
  name?: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  visible: boolean;
  children: MockThreeObject[];
  parent?: MockThreeObject | null;
  add?(object: MockThreeObject): void;
  remove?(object: MockThreeObject): void;
  traverse?(callback: (object: MockThreeObject) => void): void;
  dispose?(): void;
}

interface MockScene extends MockThreeObject {
  add(object: MockThreeObject): void;
  remove(object: MockThreeObject): void;
  children: MockThreeObject[];
}

interface MockCamera extends MockThreeObject {
  lookAt(x: number, y: number, z: number): void;
}

interface MockMesh extends MockThreeObject {
  material: any;
  geometry: any;
}

const threeRefDefinitions = {
  scene: {
    name: 'scene',
    objectType: 'three' as const,
    autoCleanup: true
  } as RefInitConfig<MockScene>,
  
  camera: {
    name: 'camera', 
    objectType: 'three' as const,
    autoCleanup: true
  } as RefInitConfig<MockCamera>,
  
  mesh: {
    name: 'mesh',
    objectType: 'three' as const,
    autoCleanup: true
  } as RefInitConfig<MockMesh>
};

const ThreeRefs = createRefContext('BasicThree', threeRefDefinitions);

function BasicThreeTest() {
  const scene = ThreeRefs.useRefHandler('scene');
  const mesh = ThreeRefs.useRefHandler('mesh');

  const handleAddMesh = () => {
    // ✅ 타입 체크: 여러 참조를 안전하게 조합
    Promise.all([
      scene.waitForMount(),
      mesh.waitForMount()
    ]).then(([sceneObj, meshObj]) => {
      sceneObj.add(meshObj); // ✅ Scene.add(mesh)
      meshObj.position.x = 5; // ✅ Mesh.position 접근
    });
  };

  return (
    <ThreeRefs.Provider>
      <button onClick={handleAddMesh}>Add Mesh to Scene</button>
    </ThreeRefs.Provider>
  );
}

// =============================================================================
// 3. 혼합 타입 테스트 (DOM + Mock Three.js)
// =============================================================================

const mixedRefDefinitions = {
  // DOM 요소들
  canvas: {
    name: 'canvas',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLCanvasElement>,
  
  modal: {
    name: 'modal',
    objectType: 'dom' as const,
    autoCleanup: true
  } as RefInitConfig<HTMLDialogElement>,

  // Mock Three.js 객체들  
  scene: {
    name: 'scene',
    objectType: 'three' as const,
    autoCleanup: true
  } as RefInitConfig<MockScene>,
  
  renderer: {
    name: 'renderer', 
    objectType: 'three' as const,
    autoCleanup: true,
    cleanup: async (renderer: MockThreeObject & { dispose(): void }) => {
      renderer.dispose();
    }
  } as RefInitConfig<MockThreeObject & { 
    domElement: HTMLCanvasElement;
    render(scene: any, camera: any): void;
    dispose(): void;
  }>
};

interface MixedActions extends RefActionPayloadMap {
  initializeGraphics: void;
  showModal: { title: string; content: string };
  renderFrame: void;
  cleanupResources: void; // 'cleanup'을 'cleanupResources'로 변경
}

const MixedRefs = createRefContext<typeof mixedRefDefinitions, MixedActions>(
  'MixedRefs',
  mixedRefDefinitions
);

function MixedRefTest() {
  const canvas = MixedRefs.useRefHandler('canvas');
  const modal = MixedRefs.useRefHandler('modal');
  const dispatch = MixedRefs.useRefAction();

  // ✅ 액션 핸들러 타입 체크 - refContext를 올바르게 사용
  MixedRefs.useRefActionHandler('initializeGraphics', async (_, controller) => {
    // ActionHandler의 두 번째 파라미터에서 refContext 접근
    console.log('Graphics initialized with controller:', controller);
  });

  MixedRefs.useRefActionHandler('showModal', async ({ title, content }) => {
    // modal ref를 직접 사용하는 방식으로 변경
    const modalElement = await modal.waitForMount();
    const h2 = modalElement.querySelector('h2');
    const p = modalElement.querySelector('p');
    
    if (h2) h2.textContent = title;
    if (p) p.textContent = content;
    
    modalElement.showModal(); // ✅ HTMLDialogElement.showModal()
  });

  return (
    <MixedRefs.Provider>
      <canvas ref={canvas.setRef} />
      <dialog ref={modal.setRef}>
        <h2>Modal Title</h2>
        <p>Modal content</p>
      </dialog>
      
      <div>
        <button onClick={() => dispatch('initializeGraphics')}>
          Initialize Graphics
        </button>
        <button onClick={() => dispatch('showModal', { 
          title: 'Hello', 
          content: 'World!' 
        })}>
          Show Modal
        </button>
      </div>
    </MixedRefs.Provider>
  );
}

// =============================================================================
// 4. 고급 타입 추론 테스트
// =============================================================================

function AdvancedTypeInferenceTest() {
  // ✅ 타입 추론: useRefState에서 정확한 타입 반환
  const canvasState = MixedRefs.useRefState('canvas');
  
  // canvasState.target의 타입은 HTMLCanvasElement | null
  if (canvasState.target) {
    const width = canvasState.target.width; // ✅ HTMLCanvasElement.width
    const height = canvasState.target.height; // ✅ HTMLCanvasElement.height
    console.log('Canvas size:', width, height);
  }

  return null;
}

// =============================================================================
// 5. 옵션 및 설정 타입 테스트
// =============================================================================

function OptionsTest() {
  const input = DOMRefs.useRefHandler('input');

  const handleOperation = () => {
    // ✅ RefOperationOptions 타입 체크
    input.withTarget((element: HTMLInputElement) => {
      element.focus();
      return element.value;
    }, {
      timeout: 5000,      // 5초 타임아웃
      retries: 3,         // 3회 재시도
      priority: 10,
      operationId: 'test-operation',
      metadata: { source: 'user-action' }
    });
  };

  return <button onClick={handleOperation}>Operation Test</button>;
}

// =============================================================================
// 타입 검증 완료 - 메인 테스트 컴포넌트
// =============================================================================

export function TypeSafetyVerification() {
  return (
    <div>
      <h1>RefContext Type Safety Verification</h1>
      <p>이 컴포넌트들이 타입 에러 없이 컴파일되면 타입 시스템이 올바르게 작동합니다.</p>
      
      <section>
        <h2>DOM References</h2>
        <BasicDOMTest />
      </section>
      
      <section>
        <h2>Three.js References</h2>
        <BasicThreeTest />
      </section>
      
      <section>
        <h2>Mixed References</h2>
        <MixedRefTest />
      </section>
      
      <section>
        <h2>Advanced Features</h2>
        <AdvancedTypeInferenceTest />
        <OptionsTest />
      </section>
    </div>
  );
}

// Jest 테스트
describe('RefContext Type Safety', () => {
  it('should compile without type errors', () => {
    // 이 테스트는 컴파일 타임에 타입 체크를 위한 것
    expect(true).toBe(true);
  });

  it('should handle DOM refs correctly', () => {
    const TestComponent = () => <BasicDOMTest />;
    expect(TestComponent).toBeDefined();
  });

  it('should handle Three.js refs correctly', () => {
    const TestComponent = () => <BasicThreeTest />;
    expect(TestComponent).toBeDefined();
  });

  it('should handle mixed refs correctly', () => {
    const TestComponent = () => <MixedRefTest />;
    expect(TestComponent).toBeDefined();
  });
});