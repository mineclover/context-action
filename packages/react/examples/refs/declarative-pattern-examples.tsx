/**
 * @fileoverview Declarative Reference Pattern Examples
 * 
 * createDeclarativeRefPattern을 사용한 포괄적인 예제들
 * - 타입 안전성
 * - 에러 처리
 * - 비동기 처리
 * - 액션 통합
 * - 실제 사용 시나리오
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createDeclarativeRefPattern } from '../../src/refs/declarative-ref-pattern';
import type { RefInitConfig } from '../../src/refs/types';

// Three.js 목 타입들 (실제로는 three 패키지의 타입을 사용)
interface ThreeObject {
  type: string;
  dispose?(): void;
}

interface ThreeScene extends ThreeObject {
  type: 'Scene';
  add(object: ThreeObject): void;
}

interface ThreeMesh extends ThreeObject {
  type: 'Mesh';
  position: { x: number; y: number; z: number };
}

/**
 * DOM + Three.js 혼합 예제
 * createDeclarativeRefPattern으로 다양한 타입의 참조를 관리
 * 에러 처리, 비동기 처리, 액션 통합 포함
 */
export function MixedRefExample() {
  // 선언적 참조 정의 - DOM과 Three.js 객체를 함께 관리
  const {
    Provider,
    useRef: useGameRef,
    useAction,
    useActionHandler
  } = createDeclarativeRefPattern('GameRefs', {
    // DOM 요소들
    canvas: {
      name: 'canvas',
      objectType: 'dom',
      validator: (target: unknown): target is HTMLCanvasElement => 
        target instanceof HTMLCanvasElement,
      mountTimeout: 5000,
      cleanup: async (canvas: HTMLCanvasElement) => {
        // Canvas cleanup
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } as RefInitConfig<HTMLCanvasElement>,
    
    button: {
      name: 'button', 
      objectType: 'dom',
      validator: (target: unknown): target is HTMLButtonElement => 
        target instanceof HTMLButtonElement,
      mountTimeout: 3000
    } as RefInitConfig<HTMLButtonElement>,

    // Three.js 객체들  
    scene: {
      name: 'scene',
      objectType: 'custom', // Three.js 객체는 custom으로 처리
      validator: (target: unknown): target is ThreeScene => 
        typeof target === 'object' && 
        target !== null && 
        (target as ThreeObject).type === 'Scene',
      cleanup: async (scene: ThreeScene) => {
        console.log('Cleaning up scene...');
        try {
          // Scene cleanup with error handling
          if (scene.dispose) {
            await scene.dispose();
          }
          console.log('Scene cleanup completed');
        } catch (error) {
          console.error('Scene cleanup failed:', error);
          throw error;
        }
      }
    } as RefInitConfig<ThreeScene>,

    mesh: {
      name: 'mesh',
      objectType: 'custom',
      validator: (target: unknown): target is ThreeMesh => 
        typeof target === 'object' && 
        target !== null && 
        (target as ThreeObject).type === 'Mesh',
      cleanup: async (mesh: ThreeMesh) => {
        console.log('Cleaning up mesh...');
        try {
          if (mesh.dispose) {
            await mesh.dispose();
          }
          console.log('Mesh cleanup completed');
        } catch (error) {
          console.error('Mesh cleanup failed:', error);
          throw error;
        }
      }
    } as RefInitConfig<ThreeMesh>
  }, {
    // 액션 정의
    initializeScene: void 0,
    addMeshToScene: void 0,
    clearScene: void 0,
    handleError: { error: Error, context: string }
  });

  return (
    <Provider>
      <GameComponent />
    </Provider>
  );
}

function GameComponent() {
  const canvasRef = useGameRef('canvas');
  const buttonRef = useGameRef('button'); 
  const sceneRef = useGameRef('scene');
  const meshRef = useGameRef('mesh');
  const dispatch = useAction();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused'>('idle');

  // 액션 핸들러 등록
  useActionHandler('initializeScene', useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 비동기 Three.js 객체 초기화 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockScene: ThreeScene = {
        type: 'Scene',
        add: (obj) => console.log('Added to scene:', obj),
        dispose: async () => {
          console.log('Scene disposed');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      };

      const mockMesh: ThreeMesh = {
        type: 'Mesh', 
        position: { x: 0, y: 0, z: 0 },
        dispose: async () => {
          console.log('Mesh disposed');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      };

      // 참조 설정
      sceneRef.current = mockScene;
      meshRef.current = mockMesh;

      setGameState('idle');
      console.log('Scene initialized successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      dispatch('handleError', { error: error as Error, context: 'initializeScene' });
    } finally {
      setIsLoading(false);
    }
  }, [sceneRef, meshRef, dispatch]));

  useActionHandler('addMeshToScene', useCallback(async () => {
    try {
      const scene = sceneRef.current;
      const mesh = meshRef.current;
      
      if (!scene || !mesh) {
        throw new Error('Scene or mesh not ready');
      }

      scene.add(mesh);
      setGameState('running');
      console.log('Mesh added to scene successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add mesh';
      setError(errorMsg);
      dispatch('handleError', { error: error as Error, context: 'addMeshToScene' });
    }
  }, [sceneRef, meshRef, dispatch]));

  useActionHandler('clearScene', useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 순차적 cleanup
      if (meshRef.current) {
        await meshRef.current.dispose?.();
        meshRef.current = null;
      }
      
      if (sceneRef.current) {
        await sceneRef.current.dispose?.();
        sceneRef.current = null;
      }

      setGameState('idle');
      console.log('Scene cleared successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to clear scene';
      setError(errorMsg);
      dispatch('handleError', { error: error as Error, context: 'clearScene' });
    } finally {
      setIsLoading(false);
    }
  }, [sceneRef, meshRef, dispatch]));

  useActionHandler('handleError', useCallback(async (payload) => {
    console.error(`Error in ${payload.context}:`, payload.error);
    setError(`${payload.context}: ${payload.error.message}`);
  }, []));

  // 컴포넌트 마운트 시 자동 초기화
  useEffect(() => {
    dispatch?.('initializeScene');
    
    return () => {
      // Cleanup on unmount
      if (sceneRef.current || meshRef.current) {
        dispatch?.('clearScene');
      }
    };
  }, [dispatch]);

  // Canvas 드로잉 효과
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 간단한 애니메이션
    let animationId: number;
    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 회전하는 사각형 그리기
      if (gameState === 'running') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((frame * Math.PI) / 180);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-50, -50, 100, 100);
        ctx.restore();
        frame += 2;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [canvasRef, gameState]);

  const handleAddToScene = () => dispatch?.('addMeshToScene');
  const handleClear = () => dispatch?.('clearScene');
  const handleReset = () => dispatch?.('initializeScene');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Advanced Mixed DOM + Three.js References</h2>
      
      {/* 에러 표시 */}
      {error && (
        <div style={{ 
          background: '#ffe6e6', 
          color: '#cc0000', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #ffcccc'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{ marginLeft: '10px', padding: '2px 8px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div style={{ 
          background: '#e6f3ff', 
          color: '#0066cc', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #cce6ff'
        }}>
          Loading...
        </div>
      )}

      {/* 게임 상태 표시 */}
      <div style={{ marginBottom: '20px' }}>
        <strong>Game State:</strong> 
        <span style={{ 
          padding: '4px 8px', 
          marginLeft: '8px',
          borderRadius: '4px',
          background: gameState === 'running' ? '#d4edda' : 
                     gameState === 'paused' ? '#fff3cd' : '#f8f9fa',
          color: gameState === 'running' ? '#155724' : 
                 gameState === 'paused' ? '#856404' : '#6c757d'
        }}>
          {gameState.toUpperCase()}
        </span>
      </div>
      
      {/* DOM 요소들 */}
      <div style={{ marginBottom: '20px' }}>
        <canvas 
          ref={canvasRef}
          width={400} 
          height={300}
          style={{ 
            border: '2px solid #333',
            borderRadius: '4px',
            display: 'block',
            marginBottom: '10px'
          }}
        />
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            ref={buttonRef} 
            onClick={handleAddToScene}
            disabled={isLoading || !sceneRef.current || !meshRef.current}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading || !sceneRef.current || !meshRef.current ? 0.6 : 1
            }}
          >
            {gameState === 'running' ? 'Mesh Added' : 'Add Mesh to Scene'}
          </button>
          
          <button 
            onClick={handleClear}
            disabled={isLoading}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Clear Scene
          </button>
          
          <button 
            onClick={handleReset}
            disabled={isLoading}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Three.js 객체 상태 표시 */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <h4>Reference Status:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Canvas: <span style={{ color: canvasRef.current ? '#28a745' : '#dc3545' }}>
            {canvasRef.current ? '✓ Ready' : '✗ Not Ready'}
          </span></li>
          <li>Button: <span style={{ color: buttonRef.current ? '#28a745' : '#dc3545' }}>
            {buttonRef.current ? '✓ Ready' : '✗ Not Ready'}
          </span></li>
          <li>Scene: <span style={{ color: sceneRef.current ? '#28a745' : '#dc3545' }}>
            {sceneRef.current ? '✓ Ready' : '✗ Not Ready'}
          </span></li>
          <li>Mesh: <span style={{ color: meshRef.current ? '#28a745' : '#dc3545' }}>
            {meshRef.current ? '✓ Ready' : '✗ Not Ready'}
          </span></li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 순수 DOM 예제  
 * createDeclarativeRefPattern으로 여러 DOM 요소를 관리
 */
export function DOMOnlyExample() {
  const {
    Provider,
    useRef: useFormRef,
    useAction
  } = createDeclarativeRefPattern('FormRefs', {
    input: {
      name: 'input',
      objectType: 'dom',
      validator: (target: unknown): target is HTMLInputElement => 
        target instanceof HTMLInputElement
    } as RefInitConfig<HTMLInputElement>,
    
    textarea: {
      name: 'textarea',
      objectType: 'dom',
      validator: (target: unknown): target is HTMLTextAreaElement => 
        target instanceof HTMLTextAreaElement  
    } as RefInitConfig<HTMLTextAreaElement>,

    submitButton: {
      name: 'submitButton',
      objectType: 'dom',
      validator: (target: unknown): target is HTMLButtonElement => 
        target instanceof HTMLButtonElement
    } as RefInitConfig<HTMLButtonElement>
  });

  return (
    <Provider>
      <FormComponent />
    </Provider>
  );
}

function FormComponent() {
  const inputRef = useFormRef('input');
  const textareaRef = useFormRef('textarea');
  const submitButtonRef = useFormRef('submitButton');

  const handleSubmit = () => {
    const input = inputRef.current;
    const textarea = textareaRef.current;
    
    if (input && textarea) {
      console.log('Form data:', {
        title: input.value,
        content: textarea.value
      });
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <h2>DOM Only References</h2>
      
      <input
        ref={inputRef}
        type="text"
        placeholder="Title"
      />
      
      <textarea
        ref={textareaRef}
        placeholder="Content"
        rows={4}
      />
      
      <button ref={submitButtonRef} onClick={handleSubmit}>
        Submit
      </button>
      
      <button onClick={focusInput}>
        Focus Input
      </button>
    </div>
  );
}

/**
 * 커스텀 객체 예제
 * createDeclarativeRefPattern으로 커스텀 객체를 관리
 */
interface GameEngine {
  start(): void;
  stop(): void;
  isRunning: boolean;
}

interface AudioManager {
  play(sound: string): void;
  stop(): void;
  volume: number;
}

export function CustomObjectExample() {
  const {
    Provider,
    useRef: useGameRef,
    useAction
  } = createDeclarativeRefPattern('GameEngine', {
    engine: {
      name: 'engine',
      objectType: 'custom',
      validator: (target: unknown): target is GameEngine => 
        typeof target === 'object' && 
        target !== null &&
        'start' in target && 
        'stop' in target &&
        'isRunning' in target,
      cleanup: async (engine: GameEngine) => {
        if (engine.isRunning) {
          engine.stop();
        }
      }
    } as RefInitConfig<GameEngine>,

    audio: {
      name: 'audio',
      objectType: 'custom', 
      validator: (target: unknown): target is AudioManager =>
        typeof target === 'object' &&
        target !== null &&
        'play' in target &&
        'stop' in target &&
        'volume' in target,
      cleanup: async (audio: AudioManager) => {
        audio.stop();
      }
    } as RefInitConfig<AudioManager>
  });

  return (
    <Provider>
      <GameEngineComponent />
    </Provider>
  );
}

function GameEngineComponent() {
  const engineRef = useGameRef('engine');
  const audioRef = useGameRef('audio');

  React.useEffect(() => {
    // 커스텀 객체 초기화
    const mockEngine: GameEngine = {
      start: () => console.log('Engine started'),
      stop: () => console.log('Engine stopped'),
      isRunning: false
    };

    const mockAudio: AudioManager = {
      play: (sound) => console.log('Playing:', sound),
      stop: () => console.log('Audio stopped'),
      volume: 0.5
    };

    engineRef.current = mockEngine;
    audioRef.current = mockAudio;

    return () => {
      engineRef.current = null;
      audioRef.current = null;
    };
  }, [engineRef, audioRef]);

  const startGame = () => {
    const engine = engineRef.current;
    const audio = audioRef.current;
    
    if (engine && audio) {
      engine.start();
      audio.play('background-music');
    }
  };

  const stopGame = () => {
    const engine = engineRef.current;
    const audio = audioRef.current;
    
    if (engine && audio) {
      engine.stop();
      audio.stop();
    }
  };

  return (
    <div>
      <h2>Custom Object References</h2>
      
      <button onClick={startGame}>Start Game</button>
      <button onClick={stopGame}>Stop Game</button>
      
      <div>
        <p>Engine: {engineRef.current ? 'Ready' : 'Not Ready'}</p>
        <p>Audio: {audioRef.current ? 'Ready' : 'Not Ready'}</p>
      </div>
    </div>
  );
}