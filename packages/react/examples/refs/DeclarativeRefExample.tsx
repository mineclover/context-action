/**
 * @fileoverview Declarative Reference Pattern Example
 * 
 * 기존 Context-Action 라이브러리 수준의 우수한 타입 추론과 
 * 선언적 관리를 보여주는 예제입니다.
 */

/// <reference path="./three-types.d.ts" />

import React from 'react';
import { 
  createDeclarativeRefPattern, 
  domRef, 
  threeRef, 
  customRef,
  DOMValidators,
  ThreeValidators,
  type ThreeScene,
  type ThreeCamera,
  type ThreeRenderer,
  type ThreeMesh
} from '../../src/refs/declarative-ref-pattern';
import type { RefActionPayloadMap } from '../../src/refs/types';

// ========================================
// 예제 1: 기본 DOM 참조 관리 (Simple Case)  
// ========================================

// 리네이밍 컨벤션: 도메인별 명확한 네이밍
const { 
  Provider: SimpleFormRefProvider,
  useRef: useSimpleFormRef
} = createDeclarativeRefPattern('SimpleForm', {
  // 직접 타입 지정으로 간단한 추론
  nameInput: domRef<HTMLInputElement>(),
  emailInput: domRef<HTMLInputElement>({ 
    name: 'email-field',
    autoCleanup: true 
  }),
  submitButton: domRef<HTMLButtonElement>(),
  messageDiv: domRef<HTMLDivElement>()
});

function SimpleFormExample() {
  const nameInput = useSimpleFormRef('nameInput');
  const emailInput = useSimpleFormRef('emailInput'); 
  const submitButton = useSimpleFormRef('submitButton');
  const messageDiv = useSimpleFormRef('messageDiv');

  // 타입 추론 확인: nameInput.target은 HTMLInputElement | null
  const handleSubmit = async () => {
    await nameInput.withTarget((input) => {
      input.focus(); // TypeScript가 HTMLInputElement 메서드를 인식
      input.select();
    });

    await messageDiv.withTarget((div) => {
      div.textContent = 'Processing...'; // HTMLDivElement 메서드
      div.style.color = 'blue';
    });
  };

  return (
    <SimpleFormRefProvider>
      <form>
        <input 
          ref={nameInput.ref} 
          type="text" 
          placeholder="이름"
        />
        <input 
          ref={emailInput.ref} 
          type="email" 
          placeholder="이메일"
        />
        <button 
          ref={submitButton.ref} 
          type="button"
          onClick={handleSubmit}
        >
          Submit
        </button>
        <div ref={messageDiv.ref} />
      </form>
    </SimpleFormRefProvider>
  );
}

// ========================================
// 예제 2: Three.js 객체 관리
// ========================================

// 리네이밍 컨벤션: ThreeGraphics 도메인
const { 
  Provider: ThreeGraphicsRefProvider,
  useRef: useThreeGraphicsRef,
  useRefManager: useThreeGraphicsRefManager 
} = createDeclarativeRefPattern('ThreeGraphics', {
  scene: threeRef<ThreeScene>({ 
    name: 'main-scene',
    validator: ThreeValidators.Scene
  }),
  camera: threeRef<ThreeCamera>({ 
    name: 'perspective-camera',
    validator: ThreeValidators.Camera
  }),
  renderer: threeRef<ThreeRenderer>({ 
    name: 'webgl-renderer',
    validator: ThreeValidators.Renderer,
    cleanup: async (renderer) => {
      renderer.dispose();
    }
  }),
  cube: threeRef<ThreeMesh>({ 
    name: 'cube-mesh',
    validator: ThreeValidators.Mesh
  })
});

function ThreeExample() {
  const cube = useThreeGraphicsRef('cube');
  const refManager = useThreeGraphicsRefManager();

  const initializeThreeJS = async () => {
    // 모든 객체가 준비될 때까지 대기
    const { scene, camera, renderer, cube: cubeMesh } = await refManager.waitForRefs('scene', 'camera', 'renderer', 'cube');
    
    // 타입 안전한 Three.js 작업
    scene.add(cubeMesh); // THREE.Scene.add 메서드
    renderer.render(scene, camera); // THREE.WebGLRenderer 메서드
  };

  const animateCube = async () => {
    await cube.withTarget((mesh) => {
      mesh.rotation.x += 0.01; // THREE.Mesh 속성
      mesh.rotation.y += 0.01;
    });
  };

  return (
    <ThreeGraphicsRefProvider>
      <div>
        <button onClick={initializeThreeJS}>Initialize 3D Scene</button>
        <button onClick={animateCube}>Animate Cube</button>
      </div>
    </ThreeGraphicsRefProvider>
  );
}

// ========================================
// 예제 3: 통합 시스템 (DOM + Three.js + Actions)
// ========================================

// 액션 정의
interface GameActions extends RefActionPayloadMap {
  initializeGame: void;
  updateScore: { score: number };
  spawnObject: { type: 'cube' | 'sphere'; position: { x: number; y: number; z: number } };
  showModal: { title: string; message: string };
  hideModal: void;
}

// 참조 정의부터 먼저
const gameRefDefinitions = {
  // DOM 요소들
  canvas: domRef<HTMLCanvasElement>({ 
    name: 'game-canvas' 
  }),
  scoreDisplay: domRef<HTMLSpanElement>({ 
    name: 'score-display' 
  }),
  modal: domRef<HTMLDivElement>({ 
    name: 'game-modal' 
  }),
  modalTitle: domRef<HTMLHeadingElement>({ 
    name: 'modal-title' 
  }),
  modalMessage: domRef<HTMLParagraphElement>({ 
    name: 'modal-message' 
  }),

  // Three.js 객체들
  gameScene: threeRef<THREE.Scene>({ 
    name: 'game-scene' 
  }),
  gameCamera: threeRef<THREE.PerspectiveCamera>({ 
    name: 'game-camera' 
  }),
  gameRenderer: threeRef<THREE.WebGLRenderer>({ 
    name: 'game-renderer' 
  })
} as const;

// 리네이밍 컨벤션: GameUI 도메인
const { 
  Provider: GameUIRefProvider,
  useRef: useGameUIRef,
  useRefManager: useGameUIRefManager,
  useAction: useGameUIAction,
  useActionHandler: useGameUIActionHandler 
} = createDeclarativeRefPattern<
  typeof gameRefDefinitions,
  GameActions
>('GameUI', {
  refs: gameRefDefinitions,
  actions: {} as GameActions,
  contextName: 'GameUI'
});

function GameComponent() {
  const canvas = useGameUIRef('canvas');
  const scoreDisplay = useGameUIRef('scoreDisplay');
  const modal = useGameUIRef('modal');
  const dispatch = useGameUIAction();
  const refManager = useGameUIRefManager();

  // 타입 안전한 액션 핸들러
  useGameUIActionHandler('initializeGame', async () => {
    const canvasEl = await canvas.waitForMount();
    const { gameScene, gameCamera, gameRenderer } = await refManager.waitForRefs('gameScene', 'gameCamera', 'gameRenderer');

    // DOM 설정
    canvasEl.width = 800;
    canvasEl.height = 600;

    // Three.js 초기화
    gameCamera.position.z = 5;
    gameRenderer.setSize(800, 600);
    canvasEl.appendChild(gameRenderer.domElement);

    console.log('게임 초기화 완료');
  });

  useGameUIActionHandler('updateScore', async (payload) => {
    const { score } = payload as { score: number };
    await scoreDisplay.withTarget((span) => {
      span.textContent = `점수: ${score}`;
      span.style.color = score > 100 ? 'gold' : 'black';
    });
  });

  useGameUIActionHandler('spawnObject', async (payload) => {
    const { type, position } = payload as { type: 'cube' | 'sphere'; position: { x: number; y: number; z: number } };
    const { gameScene } = await refManager.waitForRefs('gameScene');
    
    const geometry = type === 'cube' 
      ? new THREE.BoxGeometry(1, 1, 1)
      : new THREE.SphereGeometry(0.5, 32, 32);
      
    const material = new THREE.MeshBasicMaterial({ 
      color: Math.random() * 0xffffff 
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(position.x, position.y, position.z);
    gameScene.add(mesh);
  });

  useGameUIActionHandler('showModal', async (payload) => {
    const { title, message } = payload as { title: string; message: string };
    const modalEl = await modal.waitForMount();
    const { modalTitle, modalMessage } = await refManager.waitForRefs('modalTitle', 'modalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalEl.style.display = 'block';
    modalEl.style.position = 'fixed';
    modalEl.style.top = '50%';
    modalEl.style.left = '50%';
    modalEl.style.transform = 'translate(-50%, -50%)';
    modalEl.style.background = 'white';
    modalEl.style.padding = '20px';
    modalEl.style.border = '1px solid #ccc';
    modalEl.style.zIndex = '1000';
  });

  useGameUIActionHandler('hideModal', async () => {
    await modal.withTarget((modalEl) => {
      modalEl.style.display = 'none';
    });
  });

  return (
    <GameUIRefProvider>
      <div>
        <h1>게임 UI 예제</h1>
        
        <div>
          <span ref={scoreDisplay.ref}>점수: 0</span>
        </div>
        
        <canvas ref={canvas.ref} style={{ border: '1px solid black' }} />
        
        <div>
          <button onClick={async () => await dispatch('initializeGame')}>
            게임 초기화
          </button>
          <button onClick={async () => await dispatch('updateScore', { score: 150 })}>
            점수 업데이트
          </button>
          <button onClick={async () => await dispatch('spawnObject', { 
            type: 'cube', 
            position: { x: 0, y: 0, z: 0 } 
          })}>
            큐브 생성
          </button>
          <button onClick={async () => await dispatch('showModal', {
            title: '게임 알림',
            message: '새로운 레벨에 도달했습니다!'
          })}>
            모달 표시
          </button>
        </div>

        {/* 모달 */}
        <div ref={modal.ref} style={{ display: 'none' }}>
          <h3 ref={useGameUIRef('modalTitle').ref}>제목</h3>
          <p ref={useGameUIRef('modalMessage').ref}>메시지</p>
          <button onClick={async () => await dispatch('hideModal')}>
            닫기
          </button>
        </div>
      </div>
    </GameUIRefProvider>
  );
}

// ========================================
// 예제 4: 커스텀 객체 관리
// ========================================

interface CustomObjects {
  audioContext: AudioContext;
  videoElement: HTMLVideoElement;
  gameState: { level: number; health: number; };
}

// 리네이밍 컨벤션: CustomObjects 도메인
const { 
  Provider: CustomObjectsRefProvider,
  useRef: useCustomObjectsRef,
  useRefs: useCustomObjectsRefs
} = createDeclarativeRefPattern('CustomObjects', {
  audioContext: customRef<AudioContext>({ 
    name: 'web-audio-context',
    cleanup: async (ctx) => {
      await ctx.close();
    }
  }),
  videoElement: domRef<HTMLVideoElement>({ 
    name: 'game-video' 
  }),
  gameState: customRef<{ level: number; health: number }>({ 
    name: 'game-state-object' 
  })
});

function CustomObjectExample() {
  const [audioContext, videoElement, gameState] = useCustomObjectsRefs(
    'audioContext', 'videoElement', 'gameState'
  );

  const initializeCustomObjects = async () => {
    // 타입 안전한 커스텀 객체 작업
    await audioContext.withTarget((ctx) => {
      ctx.resume(); // AudioContext 메서드
      console.log('Audio state:', ctx.state);
    });

    await videoElement.withTarget((video) => {
      video.play(); // HTMLVideoElement 메서드
      video.volume = 0.8;
    });

    await gameState.withTarget((state) => {
      state.level = 1; // 커스텀 객체 속성
      state.health = 100;
    });
  };

  return (
    <CustomObjectsRefProvider>
      <div>
        <h2>커스텀 객체 관리</h2>
        <video ref={videoElement.ref} controls />
        <button onClick={initializeCustomObjects}>
          커스텀 객체 초기화
        </button>
      </div>
    </CustomObjectsRefProvider>
  );
}

// ========================================
// 메인 애플리케이션
// ========================================

export function DeclarativeRefExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>선언적 참조 관리 패턴 예제</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>1. 간단한 폼 관리</h2>
        <SimpleFormExample />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>2. Three.js 객체 관리</h2>
        <ThreeExample />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>3. 통합 게임 UI (DOM + Three.js + Actions)</h2>
        <GameComponent />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>4. 커스텀 객체 관리</h2>
        <CustomObjectExample />
      </div>
    </div>
  );
}

export default DeclarativeRefExample;