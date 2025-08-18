/**
 * @fileoverview Enhanced Declarative Reference Pattern Example
 * 
 * 개선된 DeclarativeRefPattern의 모든 새로운 기능들을 보여주는 종합 예제:
 * - 강화된 타입 안전성 및 런타임 검증
 * - 통일된 ref callback API
 * - 에러 처리 및 복구 로직
 * - 성능 최적화
 */

import React, { useEffect, useCallback, useState } from 'react';
import { 
  createDeclarativeRefPattern, 
  domRef, 
  threeRef,
  DOMValidators,
  ThreeValidators,
  RefErrorCode,
  RefError,
  type ErrorRecoveryStrategy,
  type ThreeScene,
  type ThreeCamera,
  type ThreeRenderer
} from '../../src/refs/declarative-ref-pattern';
import type { RefActionPayloadMap } from '../../src/refs/types';

// ========================================
// 예제 1: 강화된 타입 안전성 데모
// ========================================

const { 
  Provider: SafeFormProvider,
  useRef: useSafeFormRef
} = createDeclarativeRefPattern('SafeForm', {
  // 런타임 타입 검증이 포함된 DOM refs
  nameInput: domRef<HTMLInputElement>({ 
    name: 'name-input',
    tagName: 'input',  // 자동 태그 검증
    validator: DOMValidators.HTMLInputElement
  }),
  
  emailInput: domRef<HTMLInputElement>({ 
    name: 'email-input',
    validator: DOMValidators.HTMLInputElement
  }),
  
  canvas: domRef<HTMLCanvasElement>({ 
    name: 'drawing-canvas',
    tagName: 'canvas',
    validator: DOMValidators.HTMLCanvasElement
  }),
  
  container: domRef<HTMLDivElement>({ 
    name: 'form-container',
    validator: DOMValidators.HTMLDivElement
  })
});

function SafeFormExample() {
  // 에러 복구 전략 설정
  const errorRecovery: ErrorRecoveryStrategy<HTMLInputElement> = {
    strategy: 'retry',
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.warn('🚨 Ref Error:', error.toJSON());
    }
  };

  // 강화된 useRef 사용
  const nameInput = useSafeFormRef('nameInput', { 
    errorRecovery,
    validateOnSet: true  // 설정 시 타입 검증 활성화
  });
  
  const emailInput = useSafeFormRef('emailInput', { validateOnSet: true });
  const canvas = useSafeFormRef('canvas');
  const container = useSafeFormRef('container');

  // 에러가 있는 ref 감지
  const hasErrors = nameInput.hasError || emailInput.hasError || canvas.hasError || container.hasError;

  // 타입 안전한 조작
  const handleDrawOnCanvas = useCallback(async () => {
    const result = await canvas.withTarget((canvasEl) => {
      // ✅ HTMLCanvasElement로 완전 타입 추론됨
      const ctx = canvasEl.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(10, 10, 100, 100);
        return 'Drawing completed';
      }
      return 'No context available';
    });

    if (result.success) {
      console.log('✅ Canvas operation:', result.result);
    } else {
      console.error('❌ Canvas operation failed:', result.error);
    }
  }, [canvas]);

  const handleFormValidation = useCallback(async () => {
    // 타입 안전한 폼 검증
    await nameInput.withTarget((input) => {
      if (input.value.length < 2) {
        throw new Error('Name too short');
      }
    });

    await emailInput.withTarget((input) => {
      if (!input.value.includes('@')) {
        throw new Error('Invalid email format');
      }
    });
  }, [nameInput, emailInput]);

  return (
    <SafeFormProvider>
      <div ref={container.ref} className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">강화된 타입 안전성 데모</h2>
        
        {hasErrors && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>에러 발생!</strong>
            <ul className="mt-2">
              {nameInput.hasError && <li>Name Input: {nameInput.error?.message}</li>}
              {emailInput.hasError && <li>Email Input: {emailInput.error?.message}</li>}
              {canvas.hasError && <li>Canvas: {canvas.error?.message}</li>}
            </ul>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name (타입 검증됨)</label>
            <input 
              ref={nameInput.ref}  {/* ✅ 통일된 ref callback API */}
              type="text" 
              className="w-full p-2 border rounded"
              placeholder="최소 2글자 이상"
            />
            <div className="text-xs text-gray-600 mt-1">
              Ready: {nameInput.isReady ? '✅' : '❌'} | 
              Error: {nameInput.hasError ? '🚨' : '✅'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email (타입 검증됨)</label>
            <input 
              ref={emailInput.ref}
              type="email" 
              className="w-full p-2 border rounded"
              placeholder="valid@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Drawing Canvas (타입 검증됨)</label>
            <canvas 
              ref={canvas.ref}
              width="300" 
              height="200" 
              className="border border-gray-300"
            />
          </div>

          <div className="space-x-2">
            <button 
              onClick={handleDrawOnCanvas}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Canvas에 그리기 (타입 안전)
            </button>
            
            <button 
              onClick={handleFormValidation}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              폼 검증 (에러 처리 포함)
            </button>
          </div>
        </div>
      </div>
    </SafeFormProvider>
  );
}

// ========================================
// 예제 2: Three.js 통합 with 에러 처리
// ========================================

interface ThreeActions extends RefActionPayloadMap {
  initializeScene: void;
  addCube: { position: { x: number; y: number; z: number } };
  renderFrame: void;
  handleError: { error: Error; refName: string };
}

const { 
  Provider: ThreeEngineProvider,
  useRef: useThreeEngineRef,
  useRefManager: useThreeEngineManager,
  useAction: useThreeEngineAction,
  useActionHandler: useThreeEngineActionHandler
} = createDeclarativeRefPattern<typeof threeRefDefinitions, ThreeActions>('ThreeEngine', {
  refs: threeRefDefinitions,
  actions: {} as ThreeActions,
  contextName: 'ThreeEngine'
});

const threeRefDefinitions = {
  scene: threeRef<ThreeScene>({ 
    name: 'main-scene',
    expectedType: 'Scene',
    validator: ThreeValidators.Scene
  }),
  
  camera: threeRef<ThreeCamera>({ 
    name: 'perspective-camera',
    expectedType: 'PerspectiveCamera',
    validator: ThreeValidators.Camera
  }),
  
  renderer: threeRef<ThreeRenderer>({ 
    name: 'webgl-renderer',
    expectedType: 'WebGLRenderer', 
    validator: ThreeValidators.Renderer,
    cleanup: async (renderer: ThreeRenderer) => {
      renderer.dispose();
    }
  }),
  
  container: domRef<HTMLDivElement>({
    name: 'three-container',
    validator: DOMValidators.HTMLDivElement
  })
} as const;

function ThreeEngineExample() {
  const dispatch = useThreeEngineAction();
  const refManager = useThreeEngineManager();
  
  // 에러 복구 전략을 포함한 refs
  const scene = useThreeEngineRef('scene', {
    errorRecovery: {
      strategy: 'fallback',
      fallbackValue: (): ThreeScene => ({ 
        type: 'Scene',
        children: [],
        add: () => {},
        remove: () => {}
      }),
      onError: (error) => dispatch('handleError', { error, refName: 'scene' })
    }
  });
  
  const container = useThreeEngineRef('container');
  
  // Three.js 초기화 핸들러
  useThreeEngineActionHandler('initializeScene', async (_, { refContext }) => {
    try {
      console.log('🎬 Three.js 씬 초기화 시작...');
      
      // 모든 필요한 객체들이 준비될 때까지 대기
      const refs = await refManager.waitForRefs('scene', 'camera', 'renderer', 'container');
      
      // 타입 안전한 Three.js 설정
      refs.camera.position = { x: 0, y: 0, z: 5 };
      refs.renderer.setSize?.(800, 600);
      
      // DOM에 추가
      await container.withTarget((containerEl) => {
        if (refs.renderer.domElement) {
          containerEl.appendChild(refs.renderer.domElement);
        }
      });
      
      console.log('✅ Three.js 초기화 완료');
    } catch (error) {
      console.error('❌ Three.js 초기화 실패:', error);
      dispatch('handleError', { 
        error: error instanceof Error ? error : new Error(String(error)), 
        refName: 'scene' 
      });
    }
  });

  // 에러 처리 핸들러
  useThreeEngineActionHandler('handleError', async ({ error, refName }) => {
    console.error(`🚨 Three.js Error in ${refName}:`, {
      message: error.message,
      stack: error.stack,
      refName
    });
    
    // 에러 복구 로직
    if (error.message.includes('WebGL')) {
      alert('WebGL을 지원하지 않는 브라우저입니다. Canvas 2D로 전환됩니다.');
      // Fallback to 2D rendering logic here
    }
  });

  // 큐브 추가 핸들러
  useThreeEngineActionHandler('addCube', async ({ position }) => {
    await scene.withTarget((sceneObj) => {
      // Mock cube creation
      const cube = {
        type: 'Mesh',
        position,
        geometry: { dispose: () => {} },
        material: { dispose: () => {} }
      };
      
      sceneObj.children = sceneObj.children || [];
      sceneObj.children.push(cube);
      console.log(`📦 큐브 추가됨:`, position);
    });
  });

  // 초기화
  useEffect(() => {
    // Mock Three.js objects 생성
    const mockScene: ThreeScene = { 
      type: 'Scene' as const,
      children: [],
      add: (obj) => mockScene.children.push(obj),
      remove: (obj) => {
        const index = mockScene.children.indexOf(obj);
        if (index > -1) mockScene.children.splice(index, 1);
      }
    };
    
    const mockCamera: ThreeCamera = { 
      type: 'PerspectiveCamera' as const,
      position: { x: 0, y: 0, z: 5 }
    };
    
    const mockRenderer: ThreeRenderer = { 
      type: 'WebGLRenderer' as const,
      domElement: document.createElement('canvas'),
      setSize: (w: number, h: number) => {
        mockRenderer.domElement.width = w;
        mockRenderer.domElement.height = h;
      },
      dispose: () => console.log('🧹 Renderer disposed')
    };

    // Refs 설정
    scene.setRef(mockScene);
    useThreeEngineRef('camera').setRef(mockCamera);
    useThreeEngineRef('renderer').setRef(mockRenderer);

    // 자동 초기화
    dispatch('initializeScene');
  }, [dispatch, scene]);

  return (
    <ThreeEngineProvider>
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Three.js 통합 with 에러 처리</h2>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600">
            Scene Ready: {scene.isReady ? '✅' : '❌'} | 
            Has Error: {scene.hasError ? '🚨' : '✅'}
          </div>
          
          {scene.hasError && (
            <div className="text-red-600 text-sm mt-1">
              Error: {scene.error?.message}
            </div>
          )}
        </div>
        
        <div 
          ref={container.ref}
          className="w-full h-64 border border-gray-300 bg-gray-100 flex items-center justify-center"
        >
          Three.js 컨테이너
        </div>
        
        <div className="mt-4 space-x-2">
          <button 
            onClick={() => dispatch('addCube', { position: { x: 0, y: 0, z: 0 } })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            큐브 추가
          </button>
          
          <button 
            onClick={() => dispatch('renderFrame')}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            프레임 렌더링
          </button>
        </div>
      </div>
    </ThreeEngineProvider>
  );
}

// ========================================
// 메인 애플리케이션
// ========================================

export function EnhancedDeclarativeRefExample() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Enhanced Declarative Ref Pattern</h1>
        <p className="text-gray-600 mb-6">
          개선된 DeclarativeRefPattern의 모든 기능을 보여주는 종합 예제
        </p>
        
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">타입 안전성 강화</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">런타임 검증</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm">에러 복구</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm">API 일관성</span>
          </div>
        </div>
      </div>

      {/* 기본 예제 */}
      <SafeFormExample />
      
      {/* 고급 예제 토글 */}
      <div className="text-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          {showAdvanced ? '🔽 고급 예제 숨기기' : '🔼 고급 예제 보기'}
        </button>
      </div>
      
      {showAdvanced && (
        <>
          <ThreeEngineExample />
          
          {/* 기능 요약 */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">🚀 새로운 기능들</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ 타입 안전성 강화</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 런타임 타입 검증</li>
                  <li>• 자동 타입 가드</li>
                  <li>• 컴파일 타임 + 런타임 체크</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🔄 에러 처리 개선</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 자동 재시도 메커니즘</li>
                  <li>• Fallback 값 지원</li>
                  <li>• 상세한 에러 정보</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">📐 API 일관성</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 통일된 ref callback</li>
                  <li>• 일관된 네이밍 규칙</li>
                  <li>• 예측 가능한 동작</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">⚡ 성능 최적화</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 메모이제이션 개선</li>
                  <li>• 선택적 리렌더링</li>
                  <li>• 메모리 누수 방지</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EnhancedDeclarativeRefExample;