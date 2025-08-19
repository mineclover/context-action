/**
 * @fileoverview DOM + Three.js 통합 예제
 * 
 * 게임 UI에서 DOM 요소와 Three.js 객체를 함께 관리하는 실제 사용 사례
 * createRefContext 방법 2 (선언적 정의) 사용
 */

import React, { useEffect, useCallback, useState } from 'react';
import { createRefContext } from '../../src/refs/createRefContext';

// Three.js 목 타입들 (실제로는 three 패키지를 사용)
interface ThreeObject {
  type: string;
  uuid: string;
  dispose?(): void;
}

interface ThreeScene extends ThreeObject {
  type: 'Scene';
  background?: any;
  add(object: ThreeObject): void;
  remove(object: ThreeObject): void;
  children: ThreeObject[];
}

interface ThreeCamera extends ThreeObject {
  type: 'PerspectiveCamera';
  position: { x: number; y: number; z: number };
  lookAt(x: number, y: number, z: number): void;
}

interface ThreeRenderer extends ThreeObject {
  type: 'WebGLRenderer';
  domElement: HTMLCanvasElement;
  setSize(width: number, height: number): void;
  render(scene: ThreeScene, camera: ThreeCamera): void;
  dispose(): void;
}

interface ThreeMesh extends ThreeObject {
  type: 'Mesh';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  visible: boolean;
}

// 게임 UI 예제
export function GameUIExample() {
  // 방법 2: 선언적 RefDefinitions 사용
  const GameRefs = createRefContext('GameUI', {
    // DOM 요소들
    gameContainer: {
      name: 'gameContainer',
      objectType: 'dom' as const,
      autoCleanup: true
    },
    canvas: {
      name: 'canvas',
      objectType: 'dom' as const,
      autoCleanup: true,
      mountTimeout: 5000
    },
    uiOverlay: {
      name: 'uiOverlay',
      objectType: 'dom' as const,
      autoCleanup: true
    },
    scoreDisplay: {
      name: 'scoreDisplay',
      objectType: 'dom' as const,
      autoCleanup: true
    },
    controlPanel: {
      name: 'controlPanel',
      objectType: 'dom' as const,
      autoCleanup: true
    },
    
    // Three.js 객체들
    scene: {
      name: 'scene',
      objectType: 'custom' as const,
      autoCleanup: true,
      cleanup: (scene: ThreeScene) => {
        // Scene cleanup
        scene.children.forEach(child => {
          child.dispose?.();
        });
        console.log('Scene cleaned up');
      }
    },
    camera: {
      name: 'camera',
      objectType: 'custom' as const,
      autoCleanup: true,
      cleanup: (camera: ThreeCamera) => {
        camera.dispose?.();
        console.log('Camera cleaned up');
      }
    },
    renderer: {
      name: 'renderer',
      objectType: 'custom' as const,
      autoCleanup: true,
      cleanup: (renderer: ThreeRenderer) => {
        renderer.dispose();
        console.log('Renderer cleaned up');
      }
    },
    playerMesh: {
      name: 'playerMesh',
      objectType: 'custom' as const,
      autoCleanup: true,
      cleanup: (mesh: ThreeMesh) => {
        mesh.dispose?.();
        console.log('Player mesh cleaned up');
      }
    }
  });

  function GameComponent() {
    const gameContainer = GameRefs.useRefHandler('gameContainer');
    const canvas = GameRefs.useRefHandler('canvas');
    const uiOverlay = GameRefs.useRefHandler('uiOverlay');
    const scoreDisplay = GameRefs.useRefHandler('scoreDisplay');
    const controlPanel = GameRefs.useRefHandler('controlPanel');
    const scene = GameRefs.useRefHandler('scene');
    const camera = GameRefs.useRefHandler('camera');
    const renderer = GameRefs.useRefHandler('renderer');
    const playerMesh = GameRefs.useRefHandler('playerMesh');
    const waitForRefs = GameRefs.useWaitForRefs();

    const [gameState, setGameState] = useState({
      isInitialized: false,
      isRunning: false,
      score: 0,
      playerPosition: { x: 0, y: 0, z: 0 }
    });

    // Three.js Scene 초기화
    const initializeScene = useCallback(() => {
      const mockScene: ThreeScene = {
        type: 'Scene',
        uuid: 'scene-' + Math.random().toString(36).substr(2, 9),
        background: 0x222222,
        children: [],
        add: function(obj: ThreeObject) {
          this.children.push(obj);
        },
        remove: function(obj: ThreeObject) {
          const index = this.children.indexOf(obj);
          if (index > -1) {
            this.children.splice(index, 1);
          }
        }
      };

      scene.setRef(mockScene);
      console.log('Scene initialized:', mockScene);
    }, [scene]);

    // Camera 초기화
    const initializeCamera = useCallback(() => {
      const mockCamera: ThreeCamera = {
        type: 'PerspectiveCamera',
        uuid: 'camera-' + Math.random().toString(36).substr(2, 9),
        position: { x: 0, y: 5, z: 10 },
        lookAt: (x: number, y: number, z: number) => {
          console.log(`Camera looking at (${x}, ${y}, ${z})`);
        }
      };

      camera.setRef(mockCamera);
      console.log('Camera initialized:', mockCamera);
    }, [camera]);

    // Renderer 초기화
    const initializeRenderer = useCallback(async () => {
      if (canvas.target) {
        const mockRenderer: ThreeRenderer = {
          type: 'WebGLRenderer',
          uuid: 'renderer-' + Math.random().toString(36).substr(2, 9),
          domElement: canvas.target,
          setSize: (width: number, height: number) => {
            canvas.target!.width = width;
            canvas.target!.height = height;
            console.log(`Renderer size set to ${width}x${height}`);
          },
          render: (scene: ThreeScene, camera: ThreeCamera) => {
            // Canvas에 시각적 피드백
            const ctx = canvas.target!.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#333';
              ctx.fillRect(0, 0, canvas.target!.width, canvas.target!.height);
              ctx.fillStyle = '#0f0';
              ctx.fillText(`Rendering... Scene: ${scene.children.length} objects`, 10, 30);
            }
          },
          dispose: () => {
            console.log('Renderer disposed');
          }
        };

        renderer.setRef(mockRenderer);
        
        // 초기 크기 설정
        mockRenderer.setSize(800, 600);
        
        console.log('Renderer initialized:', mockRenderer);
      }
    }, [canvas.target, renderer]);

    // Player Mesh 생성
    const createPlayerMesh = useCallback(() => {
      if (scene.target) {
        const mockMesh: ThreeMesh = {
          type: 'Mesh',
          uuid: 'player-' + Math.random().toString(36).substr(2, 9),
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          visible: true,
          dispose: () => {
            console.log('Player mesh disposed');
          }
        };

        playerMesh.setRef(mockMesh);
        scene.target.add(mockMesh);
        
        console.log('Player mesh created and added to scene');
      }
    }, [scene.target, playerMesh]);

    // 게임 초기화
    const initializeGame = useCallback(async () => {
      try {
        console.log('Initializing game...');
        
        // 모든 DOM 요소 준비 대기
        await waitForRefs('gameContainer', 'canvas', 'uiOverlay', 'scoreDisplay', 'controlPanel');
        console.log('All DOM elements ready');

        // Three.js 객체들 순차 초기화
        initializeScene();
        initializeCamera();
        await initializeRenderer();
        createPlayerMesh();

        setGameState(prev => ({ ...prev, isInitialized: true }));
        console.log('Game initialization complete');
      } catch (error) {
        console.error('Game initialization failed:', error);
      }
    }, [waitForRefs, initializeScene, initializeCamera, initializeRenderer, createPlayerMesh]);

    // 게임 시작
    const startGame = useCallback(() => {
      if (gameState.isInitialized && !gameState.isRunning) {
        setGameState(prev => ({ ...prev, isRunning: true }));
        console.log('Game started');
      }
    }, [gameState.isInitialized, gameState.isRunning]);

    // 게임 정지
    const stopGame = useCallback(() => {
      if (gameState.isRunning) {
        setGameState(prev => ({ ...prev, isRunning: false }));
        console.log('Game stopped');
      }
    }, [gameState.isRunning]);

    // 플레이어 이동
    const movePlayer = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
      if (playerMesh.target && gameState.isRunning) {
        const moveDistance = 1;
        const newPosition = { ...playerMesh.target.position };

        switch (direction) {
          case 'left':
            newPosition.x -= moveDistance;
            break;
          case 'right':
            newPosition.x += moveDistance;
            break;
          case 'up':
            newPosition.z -= moveDistance;
            break;
          case 'down':
            newPosition.z += moveDistance;
            break;
        }

        playerMesh.target.position = newPosition;
        setGameState(prev => ({ 
          ...prev, 
          playerPosition: newPosition,
          score: prev.score + 10 
        }));

        console.log('Player moved:', direction, newPosition);
      }
    }, [playerMesh.target, gameState.isRunning]);

    // 점수 업데이트
    useEffect(() => {
      if (scoreDisplay.target) {
        scoreDisplay.target.textContent = `Score: ${gameState.score}`;
      }
    }, [gameState.score, scoreDisplay.target]);

    // 게임 루프 (렌더링)
    useEffect(() => {
      let animationId: number;

      if (gameState.isRunning && renderer.target && scene.target && camera.target) {
        const gameLoop = () => {
          renderer.target!.render(scene.target!, camera.target!);
          animationId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
      }

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, [gameState.isRunning, renderer.target, scene.target, camera.target]);

    // 키보드 이벤트 핸들러
    useEffect(() => {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (gameState.isRunning) {
          switch (e.key) {
            case 'ArrowLeft':
            case 'a':
              movePlayer('left');
              break;
            case 'ArrowRight':
            case 'd':
              movePlayer('right');
              break;
            case 'ArrowUp':
            case 'w':
              movePlayer('up');
              break;
            case 'ArrowDown':
            case 's':
              movePlayer('down');
              break;
          }
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.isRunning, movePlayer]);

    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
      if (gameContainer.isMounted && canvas.isMounted && uiOverlay.isMounted) {
        initializeGame();
      }
    }, [gameContainer.isMounted, canvas.isMounted, uiOverlay.isMounted, initializeGame]);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', padding: '20px' }}>
        <h2>Game UI Example</h2>
        <p>DOM + Three.js integration with createRefContext</p>

        <div 
          ref={gameContainer.setRef}
          style={{ 
            position: 'relative', 
            width: '800px', 
            height: '600px', 
            border: '2px solid #333',
            margin: '20px 0',
            backgroundColor: '#111'
          }}
        >
          <canvas
            ref={canvas.setRef}
            width={800}
            height={600}
            style={{ display: 'block', background: '#222' }}
          />

          <div 
            ref={uiOverlay.setRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              color: 'white',
              padding: '10px'
            }}
          >
            <div 
              ref={scoreDisplay.setRef}
              style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                pointerEvents: 'auto'
              }}
            >
              Score: {gameState.score}
            </div>

            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              fontSize: '14px',
              opacity: 0.7
            }}>
              Use WASD or Arrow keys to move
            </div>
          </div>
        </div>

        <div 
          ref={controlPanel.setRef}
          style={{ 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={startGame}
            disabled={!gameState.isInitialized || gameState.isRunning}
            style={{
              padding: '10px 20px',
              backgroundColor: gameState.isRunning ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: gameState.isInitialized && !gameState.isRunning ? 'pointer' : 'not-allowed'
            }}
          >
            Start Game
          </button>

          <button
            onClick={stopGame}
            disabled={!gameState.isRunning}
            style={{
              padding: '10px 20px',
              backgroundColor: gameState.isRunning ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: gameState.isRunning ? 'pointer' : 'not-allowed'
            }}
          >
            Stop Game
          </button>

          <div style={{ marginLeft: '20px' }}>
            Player: ({gameState.playerPosition.x}, {gameState.playerPosition.y}, {gameState.playerPosition.z})
          </div>
        </div>

        {/* Debug Information */}
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <h4>Debug Information</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <strong>DOM Elements:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Game Container: {gameContainer.isMounted ? '✅' : '⏳'}</li>
                <li>Canvas: {canvas.isMounted ? '✅' : '⏳'}</li>
                <li>UI Overlay: {uiOverlay.isMounted ? '✅' : '⏳'}</li>
                <li>Score Display: {scoreDisplay.isMounted ? '✅' : '⏳'}</li>
                <li>Control Panel: {controlPanel.isMounted ? '✅' : '⏳'}</li>
              </ul>
            </div>
            
            <div>
              <strong>Three.js Objects:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Scene: {scene.isMounted ? '✅' : '⏳'}</li>
                <li>Camera: {camera.isMounted ? '✅' : '⏳'}</li>
                <li>Renderer: {renderer.isMounted ? '✅' : '⏳'}</li>
                <li>Player Mesh: {playerMesh.isMounted ? '✅' : '⏳'}</li>
              </ul>
            </div>
            
            <div>
              <strong>Game State:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Initialized: {gameState.isInitialized ? '✅' : '⏳'}</li>
                <li>Running: {gameState.isRunning ? '✅' : '❌'}</li>
                <li>Score: {gameState.score}</li>
                <li>Player Position: ({gameState.playerPosition.x}, {gameState.playerPosition.y}, {gameState.playerPosition.z})</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <strong>Ref Definitions:</strong>
            <pre style={{ 
              fontSize: '10px', 
              background: 'white', 
              padding: '10px', 
              borderRadius: '3px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(GameRefs.refDefinitions, null, 2)}
            </pre>
          </div>
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

export default GameUIExample;