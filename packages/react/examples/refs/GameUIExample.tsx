/**
 * @fileoverview DOM + Three.js 통합 예제
 * 
 * 게임 UI에서 DOM 요소와 Three.js 객체를 함께 관리하는 실제 사용 사례
 */

import React, { useEffect, useCallback, useState } from 'react';
import { createRefContext } from '../../src/refs/createRefContext';
import type { RefInitConfig, RefActionPayloadMap } from '../../src/refs/types';
import type { 
  ThreeScene,
  ThreeCamera, 
  ThreeRenderer,
  ThreeMesh,
  ThreeObject
} from '../../src/refs/declarative-ref-pattern';

// 별칭 (기존 코드 호환성)
type THREE_Scene = ThreeScene;
type THREE_Camera = ThreeCamera;  
type THREE_WebGLRenderer = ThreeRenderer;
type THREE_Mesh = ThreeMesh;

// 참조 정의
const gameRefDefinitions = {
  // DOM 요소들
  gameContainer: {
    name: 'gameContainer',
    objectType: 'dom',
    autoCleanup: true
  } as RefInitConfig<HTMLDivElement>,
  
  uiOverlay: {
    name: 'uiOverlay', 
    objectType: 'dom',
    autoCleanup: true
  } as RefInitConfig<HTMLDivElement>,
  
  scoreDisplay: {
    name: 'scoreDisplay',
    objectType: 'dom', 
    autoCleanup: true
  } as RefInitConfig<HTMLSpanElement>,
  
  pauseModal: {
    name: 'pauseModal',
    objectType: 'dom',
    autoCleanup: true
  } as RefInitConfig<HTMLDialogElement>,
  
  // Three.js 객체들
  scene: {
    name: 'scene',
    objectType: 'three',
    autoCleanup: true,
    cleanup: async (scene: THREE_Scene) => {
      // Scene의 모든 자식 객체 정리
      while (scene.children.length > 0) {
        const child = scene.children[0];
        scene.remove(child);
        if (child.dispose) child.dispose();
      }
    }
  } as RefInitConfig<THREE_Scene>,
  
  camera: {
    name: 'camera',
    objectType: 'three',
    autoCleanup: true
  } as RefInitConfig<THREE_Camera>,
  
  renderer: {
    name: 'renderer',
    objectType: 'three',
    autoCleanup: true,
    cleanup: async (renderer: THREE_WebGLRenderer) => {
      renderer.dispose();
    }
  } as RefInitConfig<THREE_WebGLRenderer>,
  
  playerMesh: {
    name: 'playerMesh',
    objectType: 'three',
    autoCleanup: true,
    cleanup: async (mesh: THREE_Mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }
  } as RefInitConfig<THREE_Mesh>
};

// 액션 정의
interface GameActions extends RefActionPayloadMap {
  initializeGame: void;
  updateScore: { score: number };
  pauseGame: void;
  resumeGame: void;
  movePlayer: { x: number; y: number; z: number };
  addGameObject: { type: 'cube' | 'sphere'; position: { x: number; y: number; z: number } };
  resizeRenderer: { width: number; height: number };
}

// RefContext 생성
const GameRefs = createRefContext<typeof gameRefDefinitions, GameActions>(
  'GameUI',
  gameRefDefinitions
);

/**
 * 게임 초기화 컴포넌트
 */
function GameInitializer() {
  const dispatch = GameRefs.useRefAction();
  const refManager = GameRefs.useRefManager();

  // 게임 초기화 액션 핸들러
  GameRefs.useRefActionHandler('initializeGame', async () => {
    console.log('🎮 게임 초기화 시작...');

    // Three.js 객체들 초기화
    const [scene, camera, renderer] = await Promise.all([
      refManager.getStore('scene').waitForMount(),
      refManager.getStore('camera').waitForMount(),
      refManager.getStore('renderer').waitForMount()
    ]);

    // 카메라 설정
    if (camera.position) {
      camera.position.x = 0;
      camera.position.y = 0;
      camera.position.z = 5;
    }
    camera.lookAt?.(0, 0, 0);

    // DOM에 렌더러 캔버스 추가
    const gameContainer = await refManager.getStore('gameContainer').waitForMount();
    if (renderer.domElement) {
      gameContainer.appendChild(renderer.domElement);
    }

    // 초기 렌더링
    renderer.render?.(scene, camera);

    console.log('✅ 게임 초기화 완료');
  });

  // 점수 업데이트 핸들러
  GameRefs.useRefActionHandler('updateScore', async ({ score }) => {
    const scoreDisplay = await refManager.getStore('scoreDisplay').waitForMount();
    scoreDisplay.textContent = `Score: ${score}`;
  });

  // 게임 일시정지 핸들러
  GameRefs.useRefActionHandler('pauseGame', async () => {
    const pauseModal = await refManager.getStore('pauseModal').waitForMount();
    (pauseModal as HTMLDialogElement).showModal();
  });

  // 게임 재개 핸들러  
  GameRefs.useRefActionHandler('resumeGame', async () => {
    const pauseModal = await refManager.getStore('pauseModal').waitForMount();
    (pauseModal as HTMLDialogElement).close();
  });

  // 플레이어 이동 핸들러
  GameRefs.useRefActionHandler('movePlayer', async ({ x, y, z }) => {
    const playerMesh = await refManager.getStore('playerMesh').waitForMount();
    if (playerMesh.position) {
      playerMesh.position.x = x;
      playerMesh.position.y = y;
      playerMesh.position.z = z;
    }

    // 렌더링 업데이트
    const [scene, camera, renderer] = await Promise.all([
      refManager.getStore('scene').waitForMount(),
      refManager.getStore('camera').waitForMount(),
      refManager.getStore('renderer').waitForMount()
    ]);
    
    if (scene && camera && renderer && renderer.render) {
      renderer.render(scene, camera);
    }
  });

  // 게임 오브젝트 추가 핸들러
  GameRefs.useRefActionHandler('addGameObject', async ({ type, position }) => {
    const scene = await refManager.getStore('scene').waitForMount();
    // 실제로는 Three.js 객체 생성 로직
    const gameObject = createThreeObject(type, position);
    scene.add(gameObject);

    // 렌더링 업데이트
    const [, camera, renderer] = await Promise.all([
      refManager.getStore('scene').waitForMount(),
      refManager.getStore('camera').waitForMount(),
      refManager.getStore('renderer').waitForMount()
    ]);
    
    if (scene && camera && renderer && renderer.render) {
      renderer.render(scene, camera);
    }
  });

  // 렌더러 크기 조정 핸들러
  GameRefs.useRefActionHandler('resizeRenderer', async ({ width, height }) => {
    const renderer = await refManager.getStore('renderer').waitForMount();
    renderer.setSize(width, height);
  });

  // 컴포넌트 마운트 시 게임 초기화
  useEffect(() => {
    const initGame = async () => {
      try {
        // 모든 참조가 준비될 때까지 대기
        await refManager.waitForAll();
        
        // 게임 초기화 실행
        await dispatch('initializeGame');
        
        console.log('🚀 게임 초기화 완료');
      } catch (error) {
        console.error('❌ 게임 초기화 실패:', error);
      }
    };

    initGame();
  }, [dispatch, refManager]);

  return null; // 이 컴포넌트는 로직만 담당
}

/**
 * 게임 UI 컴포넌트
 */
function GameUI() {
  const gameContainer = GameRefs.useRef('gameContainer');
  const uiOverlay = GameRefs.useRef('uiOverlay');
  const scoreDisplay = GameRefs.useRef('scoreDisplay');
  const pauseModal = GameRefs.useRef('pauseModal');
  
  const dispatch = GameRefs.useRefAction();
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 점수 업데이트
  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
    dispatch('updateScore', { score: newScore });
  }, [dispatch]);

  // 일시정지 토글
  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      dispatch('resumeGame');
      setIsPaused(false);
    } else {
      dispatch('pauseGame');
      setIsPaused(true);
    }
  }, [dispatch, isPaused]);

  // 플레이어 이동 (키보드 입력)
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const step = 0.5;
    switch (event.key) {
      case 'ArrowUp':
        dispatch('movePlayer', { x: 0, y: step, z: 0 });
        break;
      case 'ArrowDown':
        dispatch('movePlayer', { x: 0, y: -step, z: 0 });
        break;
      case 'ArrowLeft':
        dispatch('movePlayer', { x: -step, y: 0, z: 0 });
        break;
      case 'ArrowRight':
        dispatch('movePlayer', { x: step, y: 0, z: 0 });
        break;
      case ' ':
        event.preventDefault();
        handlePauseToggle();
        break;
    }
  }, [dispatch, handlePauseToggle]);

  // 게임 오브젝트 추가
  const handleAddCube = useCallback(() => {
    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 10; 
    const z = (Math.random() - 0.5) * 10;
    dispatch('addGameObject', { type: 'cube', position: { x, y, z } });
  }, [dispatch]);

  // 윈도우 크기 변경 처리
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      dispatch('resizeRenderer', { width, height });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <div 
      ref={gameContainer.setRef}
      className="game-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh',
        outline: 'none'
      }}
    >
      {/* UI 오버레이 */}
      <div 
        ref={uiOverlay.setRef}
        className="ui-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white'
        }}
      >
        <div className="game-hud" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span ref={scoreDisplay.setRef} className="score">Score: 0</span>
          
          <div className="controls">
            <button onClick={handlePauseToggle} style={{ marginRight: '10px' }}>
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button onClick={handleAddCube}>
              ➕ Add Cube
            </button>
            <button onClick={() => handleScoreChange(score + 10)}>
              +10 Points
            </button>
          </div>
        </div>
        
        <div className="instructions" style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          Use arrow keys to move, Space to pause
        </div>
      </div>

      {/* 일시정지 모달 */}
      <dialog 
        ref={pauseModal.setRef}
        className="pause-modal"
        style={{
          padding: '40px',
          border: 'none',
          borderRadius: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <h2>⏸️ Game Paused</h2>
        <p>Press Resume to continue playing</p>
        <button 
          onClick={() => handlePauseToggle()}
          style={{ 
            padding: '10px 20px',
            fontSize: '16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ▶️ Resume Game
        </button>
      </dialog>
    </div>
  );
}

/**
 * Three.js 객체 생성 mock 함수
 */
function createThreeObject(type: 'cube' | 'sphere', position: { x: number; y: number; z: number }): any {
  // 실제로는 THREE.Mesh, THREE.BoxGeometry 등을 사용
  return {
    uuid: `${type}_${Date.now()}_${Math.random()}`,
    name: type,
    type: type === 'cube' ? 'Mesh' : 'Mesh',
    position,
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    visible: true,
    children: [],
    parent: null,
    add: () => {},
    remove: () => {},
    traverse: () => {},
    dispose: () => {}
  };
}

/**
 * Three.js 객체들을 실제로 생성하는 mock 컴포넌트들
 */
function ThreeObjectsSetup() {
  const scene = GameRefs.useRef('scene');
  const camera = GameRefs.useRef('camera'); 
  const renderer = GameRefs.useRef('renderer');
  const playerMesh = GameRefs.useRef('playerMesh');

  useEffect(() => {
    // Mock Three.js 객체 생성
    // 실제로는 new THREE.Scene(), new THREE.PerspectiveCamera() 등을 사용

    const mockScene: THREE_Scene = {
      type: 'Scene' as const,
      children: [],
      add: function(object: any) { 
        this.children.push(object); 
        if (object) object.parent = this; 
      },
      remove: function(object: any) { 
        const index = this.children.indexOf(object);
        if (index !== -1) this.children.splice(index, 1);
        if (object) object.parent = null;
      }
    };

    const mockCamera: THREE_Camera = {
      type: 'PerspectiveCamera' as const,
      position: { x: 0, y: 0, z: 5 },
      lookAt: () => {}
    };

    const mockRenderer: THREE_WebGLRenderer = {
      type: 'WebGLRenderer' as const,
      domElement: document.createElement('canvas'),
      setSize: function(width: number, height: number) {
        this.domElement.width = width;
        this.domElement.height = height;
        this.domElement.style.width = width + 'px';
        this.domElement.style.height = height + 'px';
      },
      render: () => {
        // Mock 렌더링 - 실제로는 WebGL 렌더링
        console.log('🎨 Rendering frame...');
      },
      dispose: () => {
        console.log('🧹 Renderer disposed');
      }
    };

    const mockPlayerMesh: THREE_Mesh = {
      type: 'Mesh' as const,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      geometry: { dispose: () => console.log('Geometry disposed') },
      material: { dispose: () => console.log('Material disposed') }
    };

    // 초기 크기 설정
    mockRenderer.setSize(window.innerWidth, window.innerHeight);

    // RefStore에 설정
    scene.setRef(mockScene);
    camera.setRef(mockCamera);
    renderer.setRef(mockRenderer);
    playerMesh.setRef(mockPlayerMesh);

    // Scene에 플레이어 추가
    mockScene.add(mockPlayerMesh);

    return () => {
      // Cleanup
      scene.setRef(null);
      camera.setRef(null);
      renderer.setRef(null);
      playerMesh.setRef(null);
    };
  }, [scene, camera, renderer, playerMesh]);

  return null;
}

/**
 * 메인 게임 애플리케이션
 */
export function GameApp() {
  return (
    <GameRefs.Provider>
      <ThreeObjectsSetup />
      <GameInitializer />
      <GameUI />
    </GameRefs.Provider>
  );
}

export default GameApp;