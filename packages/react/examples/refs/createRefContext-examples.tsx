/**
 * @fileoverview createRefContext Examples
 * 
 * createRefContext를 사용한 포괄적인 예제들
 * - 심플한 타입 사용법 (방법 1)
 * - 선언적 RefDefinitions 사용법 (방법 2)
 * - 실제 사용 시나리오들
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createRefContext } from '../../src/refs/createRefContext';

// Three.js 목 타입들 (실제로는 three 패키지의 타입을 사용)
interface ThreeObject {
  type: string;
  dispose?(): void;
  uuid: string;
}

interface ThreeScene extends ThreeObject {
  type: 'Scene';
  add(object: ThreeObject): void;
  children: ThreeObject[];
}

interface ThreeMesh extends ThreeObject {
  type: 'Mesh';
  position: { x: number; y: number; z: number };
  parent?: ThreeScene;
}

/**
 * 방법 1: 심플한 타입 사용 예제 (Legacy)
 * 타입만 지정하고 간단하게 사용하는 방식
 */
export function SimpleRefExample() {
  // 심플한 타입 지정
  const GameRefs = createRefContext<{
    canvas: HTMLCanvasElement;
    button: HTMLButtonElement;
    input: HTMLInputElement;
  }>('SimpleGameRefs');

  function GameComponent() {
    const canvas = GameRefs.useRefHandler('canvas');
    const button = GameRefs.useRefHandler('button');
    const input = GameRefs.useRefHandler('input');
    const waitForRefs = GameRefs.useWaitForRefs();

    const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing'>('loading');

    const initializeGame = useCallback(async () => {
      try {
        // 모든 요소가 준비될 때까지 대기
        const refs = await waitForRefs('canvas', 'button', 'input');
        
        console.log('All refs ready:', refs);
        
        // Canvas 초기화
        if (refs.canvas) {
          const ctx = refs.canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(0, 0, refs.canvas.width, refs.canvas.height);
          }
        }

        setGameState('ready');
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    }, [waitForRefs]);

    const startGame = useCallback(() => {
      if (gameState === 'ready' && canvas.target) {
        setGameState('playing');
        console.log('Game started!');
      }
    }, [gameState, canvas.target]);

    useEffect(() => {
      if (canvas.isMounted && button.isMounted && input.isMounted) {
        initializeGame();
      }
    }, [canvas.isMounted, button.isMounted, input.isMounted, initializeGame]);

    return (
      <div style={{ padding: '20px' }}>
        <h2>Simple Ref Example</h2>
        <p>Game State: {gameState}</p>
        
        <canvas 
          ref={canvas.setRef}
          width={400} 
          height={300} 
          style={{ border: '1px solid #ccc', display: 'block', margin: '10px 0' }}
        />
        
        <input 
          ref={input.setRef}
          type="text" 
          placeholder="Player name..."
          style={{ margin: '10px 0', padding: '5px' }}
        />
        
        <button 
          ref={button.setRef}
          onClick={startGame}
          disabled={gameState !== 'ready'}
          style={{ padding: '10px 20px', marginLeft: '10px' }}
        >
          Start Game
        </button>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>Canvas mounted: {canvas.isMounted.toString()}</p>
          <p>Button mounted: {button.isMounted.toString()}</p>
          <p>Input mounted: {input.isMounted.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <GameRefs.Provider>
      <GameComponent />
    </GameRefs.Provider>
  );
}

/**
 * 방법 2: 선언적 RefDefinitions 사용 예제 (권장)
 * 더 안전하고 기능이 풍부한 선언적 정의 방식
 */
export function DeclarativeRefExample() {
  // 선언적 정의
  const GameRefs = createRefContext('DeclarativeGameRefs', {
    canvas: {
      name: 'canvas',
      objectType: 'dom' as const,
      autoCleanup: true,
      mountTimeout: 5000
    },
    scene: {
      name: 'scene',
      objectType: 'custom' as const,
      autoCleanup: true,
      cleanup: (scene: ThreeScene) => {
        // Three.js Scene cleanup
        scene.children.forEach(child => {
          child.dispose?.();
        });
        console.log('Scene cleaned up');
      }
    },
    mesh: {
      name: 'mesh',
      objectType: 'custom' as const,
      autoCleanup: true,
      cleanup: (mesh: ThreeMesh) => {
        mesh.dispose?.();
        console.log('Mesh cleaned up');
      }
    },
    controls: {
      name: 'controls',
      objectType: 'dom' as const,
      autoCleanup: true,
      mountTimeout: 3000
    }
  });

  function GameComponent() {
    const canvas = GameRefs.useRefHandler('canvas');
    const scene = GameRefs.useRefHandler('scene');
    const mesh = GameRefs.useRefHandler('mesh');
    const controls = GameRefs.useRefHandler('controls');
    const waitForRefs = GameRefs.useWaitForRefs();
    const getAllRefs = GameRefs.useGetAllRefs();

    const [initState, setInitState] = useState<{
      canvas: boolean;
      scene: boolean;
      mesh: boolean;
    }>({
      canvas: false,
      scene: false,
      mesh: false
    });

    // Canvas 초기화
    const initializeCanvas = useCallback(async () => {
      if (canvas.target) {
        const ctx = canvas.target.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'darkblue';
          ctx.fillRect(0, 0, canvas.target.width, canvas.target.height);
          ctx.fillStyle = 'white';
          ctx.font = '16px Arial';
          ctx.fillText('Canvas Ready!', 10, 30);
        }
        setInitState(prev => ({ ...prev, canvas: true }));
      }
    }, [canvas.target]);

    // Three.js Scene 생성 및 설정
    const createScene = useCallback(() => {
      // Mock Three.js Scene 생성
      const mockScene: ThreeScene = {
        type: 'Scene',
        uuid: 'scene-' + Math.random().toString(36).substr(2, 9),
        children: [],
        add: function(obj: ThreeObject) {
          this.children.push(obj);
          if ('parent' in obj) {
            (obj as any).parent = this;
          }
        }
      };

      scene.setRef(mockScene);
      setInitState(prev => ({ ...prev, scene: true }));
      console.log('Scene created:', mockScene);
    }, [scene]);

    // Mesh 생성 및 Scene에 추가
    const createMesh = useCallback(() => {
      if (scene.target) {
        const mockMesh: ThreeMesh = {
          type: 'Mesh',
          uuid: 'mesh-' + Math.random().toString(36).substr(2, 9),
          position: { x: 0, y: 0, z: 0 },
          dispose: () => console.log('Mesh disposed')
        };

        mesh.setRef(mockMesh);
        scene.target.add(mockMesh);
        setInitState(prev => ({ ...prev, mesh: true }));
        console.log('Mesh created and added to scene:', mockMesh);
      }
    }, [scene.target, mesh]);

    // 전체 초기화 순서 관리
    const initializeAll = useCallback(async () => {
      try {
        // Canvas와 Controls 준비 대기
        await waitForRefs('canvas', 'controls');
        console.log('DOM elements ready');
        
        // 단계별 초기화
        await initializeCanvas();
        createScene();
        
        // Scene이 설정된 후 Mesh 생성
        setTimeout(createMesh, 100);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    }, [waitForRefs, initializeCanvas, createScene, createMesh]);

    // Canvas와 Controls가 마운트되면 초기화 시작
    useEffect(() => {
      if (canvas.isMounted && controls.isMounted) {
        initializeAll();
      }
    }, [canvas.isMounted, controls.isMounted, initializeAll]);

    // withTarget 사용 예제
    const drawOnCanvas = useCallback(async () => {
      const result = await canvas.withTarget(async (canvasEl) => {
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          const time = Date.now();
          ctx.fillStyle = `hsl(${time % 360}, 70%, 50%)`;
          ctx.fillRect(10 + (time % 100), 50, 20, 20);
          return `Drew at ${time}`;
        }
        return 'No context';
      });

      if (result.success) {
        console.log('Draw operation:', result.result);
      }
    }, [canvas]);

    const showAllRefs = useCallback(() => {
      const allRefs = getAllRefs();
      console.log('All current refs:', allRefs);
      alert(`Active refs: ${Object.keys(allRefs).join(', ')}`);
    }, [getAllRefs]);

    return (
      <div style={{ padding: '20px' }}>
        <h2>Declarative Ref Example</h2>
        <p>Using RefDefinitions with cleanup and validation</p>
        
        <canvas 
          ref={canvas.setRef}
          width={400} 
          height={200} 
          style={{ border: '1px solid #333', display: 'block', margin: '10px 0' }}
        />
        
        <div ref={controls.setRef} style={{ margin: '10px 0' }}>
          <button onClick={drawOnCanvas} style={{ margin: '5px' }}>
            Draw on Canvas
          </button>
          <button onClick={showAllRefs} style={{ margin: '5px' }}>
            Show All Refs
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <h4>Initialization Status:</h4>
          <p>Canvas: {initState.canvas ? '✅' : '⏳'} (mounted: {canvas.isMounted.toString()})</p>
          <p>Scene: {initState.scene ? '✅' : '⏳'} (mounted: {scene.isMounted.toString()})</p>
          <p>Mesh: {initState.mesh ? '✅' : '⏳'} (mounted: {mesh.isMounted.toString()})</p>
          <p>Controls: {controls.isMounted ? '✅' : '⏳'}</p>
          
          <h4>Ref Definitions:</h4>
          <pre style={{ fontSize: '10px', background: '#f5f5f5', padding: '10px' }}>
            {JSON.stringify(GameRefs.refDefinitions, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <GameRefs.Provider>
      <GameComponent />
    </GameRefs.Provider>
  );
}

/**
 * 실제 프로젝트 시나리오: 폼 관리
 * createRefContext를 사용한 폼 요소 관리 예제
 */
export function FormManagementExample() {
  const FormRefs = createRefContext('FormRefs', {
    form: {
      name: 'form',
      objectType: 'dom' as const,
      autoCleanup: true
    },
    nameInput: {
      name: 'nameInput',
      objectType: 'dom' as const,
      autoCleanup: true,
      validator: (target: unknown): target is HTMLInputElement => 
        target instanceof HTMLInputElement
    },
    emailInput: {
      name: 'emailInput',
      objectType: 'dom' as const,
      autoCleanup: true
    },
    submitButton: {
      name: 'submitButton',
      objectType: 'dom' as const,
      autoCleanup: true
    }
  });

  function FormComponent() {
    const form = FormRefs.useRefHandler('form');
    const nameInput = FormRefs.useRefHandler('nameInput');
    const emailInput = FormRefs.useRefHandler('emailInput');
    const submitButton = FormRefs.useRefHandler('submitButton');
    const waitForRefs = FormRefs.useWaitForRefs();

    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = useCallback(async () => {
      const refs = await waitForRefs('nameInput', 'emailInput');
      
      const nameValid = refs.nameInput?.value.trim().length > 0;
      const emailValid = refs.emailInput?.value.includes('@');
      
      return nameValid && emailValid;
    }, [waitForRefs]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (await validateForm()) {
        setIsSubmitting(true);
        
        // 폼 데이터 수집
        const refs = await waitForRefs('nameInput', 'emailInput');
        const data = {
          name: refs.nameInput?.value || '',
          email: refs.emailInput?.value || ''
        };
        
        console.log('Submitting:', data);
        
        // 가상 API 호출
        setTimeout(() => {
          setIsSubmitting(false);
          alert(`Form submitted: ${JSON.stringify(data, null, 2)}`);
          
          // 폼 초기화
          if (refs.nameInput) refs.nameInput.value = '';
          if (refs.emailInput) refs.emailInput.value = '';
        }, 2000);
      } else {
        alert('Please fill all required fields correctly');
      }
    }, [validateForm, waitForRefs]);

    const focusFirst = useCallback(async () => {
      try {
        const nameEl = await nameInput.waitForMount();
        nameEl.focus();
      } catch (error) {
        console.error('Failed to focus name input:', error);
      }
    }, [nameInput]);

    useEffect(() => {
      // 모든 요소가 마운트되면 첫 번째 입력에 포커스
      if (form.isMounted && nameInput.isMounted && emailInput.isMounted && submitButton.isMounted) {
        focusFirst();
      }
    }, [form.isMounted, nameInput.isMounted, emailInput.isMounted, submitButton.isMounted, focusFirst]);

    return (
      <div style={{ padding: '20px' }}>
        <h2>Form Management Example</h2>
        
        <form ref={form.setRef} onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
            <input
              ref={nameInput.setRef}
              type="text"
              required
              style={{ width: '100%', padding: '8px' }}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              ref={emailInput.setRef}
              type="email"
              required
              style={{ width: '100%', padding: '8px' }}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <button
            ref={submitButton.setRef}
            type="submit"
            disabled={isSubmitting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isSubmitting ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <h4>Mount Status:</h4>
          <p>Form: {form.isMounted ? '✅' : '⏳'}</p>
          <p>Name Input: {nameInput.isMounted ? '✅' : '⏳'}</p>
          <p>Email Input: {emailInput.isMounted ? '✅' : '⏳'}</p>
          <p>Submit Button: {submitButton.isMounted ? '✅' : '⏳'}</p>
        </div>
      </div>
    );
  }

  return (
    <FormRefs.Provider>
      <FormComponent />
    </FormRefs.Provider>
  );
}

/**
 * 전체 예제 컴포넌트
 */
export function RefContextExamples() {
  const [activeExample, setActiveExample] = useState<'simple' | 'declarative' | 'form'>('simple');

  return (
    <div style={{ padding: '20px' }}>
      <h1>createRefContext Examples</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveExample('simple')}
          style={{ 
            margin: '5px',
            padding: '10px 15px',
            backgroundColor: activeExample === 'simple' ? '#007bff' : '#f8f9fa',
            color: activeExample === 'simple' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}
        >
          Simple Usage (Method 1)
        </button>
        
        <button 
          onClick={() => setActiveExample('declarative')}
          style={{ 
            margin: '5px',
            padding: '10px 15px',
            backgroundColor: activeExample === 'declarative' ? '#007bff' : '#f8f9fa',
            color: activeExample === 'declarative' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}
        >
          Declarative Usage (Method 2)
        </button>
        
        <button 
          onClick={() => setActiveExample('form')}
          style={{ 
            margin: '5px',
            padding: '10px 15px',
            backgroundColor: activeExample === 'form' ? '#007bff' : '#f8f9fa',
            color: activeExample === 'form' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}
        >
          Form Management
        </button>
      </div>

      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        {activeExample === 'simple' && <SimpleRefExample />}
        {activeExample === 'declarative' && <DeclarativeRefExample />}
        {activeExample === 'form' && <FormManagementExample />}
      </div>
    </div>
  );
}