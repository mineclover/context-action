/**
 * @fileoverview Declarative Reference Pattern Type Safety Tests
 * 
 * 기존 Context-Action 라이브러리 수준의 타입 추론 품질을 검증합니다.
 */

import React from 'react';
import { 
  createDeclarativeRefPattern, 
  domRef, 
  customRef 
} from '../../src/refs/declarative-ref-pattern';
import type { RefActionPayloadMap, RefInitConfig } from '../../src/refs/types';

// ========================================
// 타입 추론 테스트 1: 기본 DOM 참조
// ========================================

// 리네이밍 컨벤션: TestForm 도메인
const { 
  Provider: TestFormRefProvider,
  useRef: useTestFormRef,
  useRefValue: useTestFormRefValue,
  useRefs: useTestFormRefs,
  useRefManager: useTestFormRefManager
} = createDeclarativeRefPattern('TestForm', {
  // 직접 타입으로 추론
  nameInput: domRef<HTMLInputElement>(),
  emailInput: domRef<HTMLInputElement>(),
  submitButton: domRef<HTMLButtonElement>(),
  messageDiv: domRef<HTMLDivElement>()
});

function TestFormTypeInference() {
  const nameInput = useTestFormRef('nameInput');
  const emailInput = useTestFormRef('emailInput');
  const submitButton = useTestFormRef('submitButton');
  
  // 타입 검증: HTMLInputElement | null
  const nameValue: HTMLInputElement | null = nameInput.target;
  const emailValue: HTMLInputElement | null = emailInput.target;
  const buttonValue: HTMLButtonElement | null = submitButton.target;
  
  // useRefValue를 통한 타입 추론
  const nameInputValue: HTMLInputElement | null = useTestFormRefValue('nameInput');
  const emailInputValue: HTMLInputElement | null = useTestFormRefValue('emailInput');
  
  // 여러 참조 한번에 가져오기
  const [name, email, button] = useTestFormRefs('nameInput', 'emailInput', 'submitButton');
  
  // 타입 검증: 각 요소가 올바른 타입을 가져야 함
  const nameTarget: HTMLInputElement | null = name.target;
  const emailTarget: HTMLInputElement | null = email.target;
  const buttonTarget: HTMLButtonElement | null = button.target;
  
  // withTarget 메서드 타입 검증
  const handleFormAction = async () => {
    // HTMLInputElement 메서드 사용 가능
    await nameInput.withTarget((input) => {
      input.focus(); // ✅ TypeScript가 HTMLInputElement 메서드 인식
      input.select();
      input.setSelectionRange(0, input.value.length);
      return input.value; // string 반환
    });

    // HTMLButtonElement 메서드 사용 가능  
    await submitButton.withTarget((btn) => {
      btn.click(); // ✅ HTMLButtonElement 메서드 인식
      btn.disabled = true;
    });
  };

  return null; // 컴파일 테스트용
}

// ========================================
// 타입 추론 테스트 2: Three.js 객체 참조
// ========================================

// Three.js 타입 정의 (테스트용)
interface ThreeScene {
  type: 'Scene';
  add(object: any): void;
  dispose?(): void;
}

interface ThreePerspectiveCamera {
  type: 'PerspectiveCamera';
  position: { x: number; y: number; z: number };
  dispose?(): void;
}

interface ThreeWebGLRenderer {
  type: 'WebGLRenderer';
  domElement: HTMLCanvasElement;
  dispose?(): void;
}

interface ThreeMesh {
  type: 'Mesh';
  position: { x: number; y: number; z: number };
  dispose?(): void;
}

// 리네이밍 컨벤션: TestThree 도메인
const { 
  Provider: TestThreeRefProvider,
  useRef: useTestThreeRef,
  useRefs: useTestThreeRefs,
  useRefManager: useTestThreeRefManager 
} = createDeclarativeRefPattern('TestThree', {
  scene: {
    name: 'scene',
    objectType: 'custom',
    validator: (target: unknown): target is ThreeScene =>
      typeof target === 'object' && target !== null && 
      (target as any).type === 'Scene'
  } as RefInitConfig<ThreeScene>,
  
  camera: {
    name: 'camera',
    objectType: 'custom',
    validator: (target: unknown): target is ThreePerspectiveCamera =>
      typeof target === 'object' && target !== null && 
      (target as any).type === 'PerspectiveCamera'
  } as RefInitConfig<ThreePerspectiveCamera>,
  
  renderer: {
    name: 'renderer',
    objectType: 'custom',
    validator: (target: unknown): target is ThreeWebGLRenderer =>
      typeof target === 'object' && target !== null && 
      (target as any).type === 'WebGLRenderer'
  } as RefInitConfig<ThreeWebGLRenderer>,
  
  mesh: {
    name: 'mesh',
    objectType: 'custom',
    validator: (target: unknown): target is ThreeMesh =>
      typeof target === 'object' && target !== null && 
      (target as any).type === 'Mesh'
  } as RefInitConfig<ThreeMesh>
});

function TestThreeTypeInference() {
  const scene = useTestThreeRef('scene');
  const camera = useTestThreeRef('camera');
  const renderer = useTestThreeRef('renderer');
  const mesh = useTestThreeRef('mesh');
  
  // 타입 검증
  const sceneValue: THREE.Scene | null = scene.target;
  const cameraValue: THREE.PerspectiveCamera | null = camera.target;
  const rendererValue: THREE.WebGLRenderer | null = renderer.target;
  const meshValue: THREE.Mesh | null = mesh.target;
  
  // 여러 객체 한번에 처리
  const [sceneRef, cameraRef, rendererRef] = useTestThreeRefs('scene', 'camera', 'renderer');
  
  const handleThreeAction = async () => {
    // THREE.Scene 메서드 사용 가능
    await scene.withTarget((sceneObj) => {
      sceneObj.add(new THREE.Mesh()); // ✅ THREE.Scene 메서드 인식
      sceneObj.remove(new THREE.Mesh());
      const children: THREE.Object3D[] = sceneObj.children; // 속성 접근
    });

    // THREE.WebGLRenderer 메서드 사용 가능
    await renderer.withTarget((rendererObj) => {
      rendererObj.render(new THREE.Scene(), new THREE.Camera()); // ✅ THREE.WebGLRenderer 메서드
      rendererObj.setSize(800, 600);
      rendererObj.dispose();
    });

    // 여러 객체 동시 대기
    const refs = await useTestThreeRefManager().waitForRefs('scene', 'camera', 'renderer');
    const sceneObj: THREE.Scene = refs.scene; // ✅ 정확한 타입 추론
    const cameraObj: THREE.PerspectiveCamera = refs.camera;
    const rendererObj: THREE.WebGLRenderer = refs.renderer;
  };

  return null; // 컴파일 테스트용
}

// ========================================
// 타입 추론 테스트 3: 통합 시스템 (DOM + Three.js + Actions)
// ========================================

interface TestGameActions extends RefActionPayloadMap {
  initializeGame: void;
  updateScore: { score: number; bonus?: number };
  spawnObject: { 
    type: 'cube' | 'sphere'; 
    position: { x: number; y: number; z: number };
    color?: string;
  };
  showMessage: { message: string; duration?: number };
}

// 리네이밍 컨벤션: TestGame 도메인
const { 
  Provider: TestGameRefProvider,
  useRef: useTestGameRef,
  useRefValue: useTestGameRefValue,
  useRefs: useTestGameRefs,
  useRefManager: useTestGameRefManager,
  useAction: useTestGameAction,
  useActionHandler: useTestGameActionHandler
} = createDeclarativeRefPattern('TestGame', {
  refs: {
    // DOM 요소들
    canvas: domRef<HTMLCanvasElement>(),
    scoreDisplay: domRef<HTMLSpanElement>(),
    modal: domRef<HTMLDivElement>(),
    
    // Three.js 객체들
    gameScene: {
      name: 'gameScene',
      objectType: 'custom',
      validator: (target: unknown): target is ThreeScene =>
        typeof target === 'object' && target !== null && 
        (target as any).type === 'Scene'
    } as RefInitConfig<ThreeScene>,
    gameCamera: {
      name: 'gameCamera', 
      objectType: 'custom',
      validator: (target: unknown): target is ThreePerspectiveCamera =>
        typeof target === 'object' && target !== null && 
        (target as any).type === 'PerspectiveCamera'
    } as RefInitConfig<ThreePerspectiveCamera>,
    gameRenderer: {
      name: 'gameRenderer',
      objectType: 'custom',
      validator: (target: unknown): target is ThreeWebGLRenderer =>
        typeof target === 'object' && target !== null && 
        (target as any).type === 'WebGLRenderer'
    } as RefInitConfig<ThreeWebGLRenderer>
  },
  actions: {
    initializeGame: undefined,
    updateScore: undefined,
    spawnObject: undefined,
    showMessage: undefined
  } as TestGameActions
});

function TestIntegratedTypeInference() {
  const canvas = useTestGameRef('canvas');
  const scoreDisplay = useTestGameRef('scoreDisplay');
  const gameScene = useTestGameRef('gameScene');
  const dispatch = useTestGameAction();
  const refManager = useTestGameRefManager();
  
  // 타입 검증: DOM 요소들
  const canvasValue: HTMLCanvasElement | null = canvas.target;
  const scoreValue: HTMLSpanElement | null = scoreDisplay.target;
  
  // 타입 검증: Three.js 객체들
  const sceneValue: THREE.Scene | null = gameScene.target;
  
  // 직접 값 접근 (useRefValue)
  const canvasEl: HTMLCanvasElement | null = useTestGameRefValue('canvas');
  const sceneObj: THREE.Scene | null = useTestGameRefValue('gameScene');
  
  // 여러 참조 한번에 (혼합 타입)
  const [canvasRef, sceneRef] = useTestGameRefs('canvas', 'gameScene');
  const mixedCanvas: HTMLCanvasElement | null = canvasRef.target;
  const mixedScene: THREE.Scene | null = sceneRef.target;
  
  // 액션 핸들러 타입 검증
  useTestGameActionHandler('initializeGame', async () => {
    // payload가 void이므로 파라미터 없음 ✅
    console.log('게임 초기화');
  });

  useTestGameActionHandler('updateScore', async ({ score, bonus }) => {
    // payload 타입이 { score: number; bonus?: number } ✅
    const totalScore: number = score + (bonus || 0);
    console.log('점수 업데이트:', totalScore);
  });

  useTestGameActionHandler('spawnObject', async ({ type, position, color }) => {
    // payload 타입이 정확히 추론됨 ✅
    const objectType: 'cube' | 'sphere' = type;
    const pos: { x: number; y: number; z: number } = position;
    const objColor: string | undefined = color;
    
    console.log(`Spawning ${objectType} at`, pos, 'with color', objColor);
  });

  // 액션 디스패치 타입 검증
  const handleGameActions = async () => {
    // void 액션
    await dispatch?.('initializeGame'); // ✅ payload 없음
    
    // 필수 payload가 있는 액션
    await dispatch?.('updateScore', { score: 100 }); // ✅ 필수 score
    await dispatch?.('updateScore', { score: 100, bonus: 50 }); // ✅ 옵션 bonus
    
    // 복잡한 payload 구조
    await dispatch?.('spawnObject', { 
      type: 'cube', 
      position: { x: 0, y: 1, z: 2 }
    }); // ✅ 필수 필드만
    
    await dispatch?.('spawnObject', { 
      type: 'sphere', 
      position: { x: 1, y: 2, z: 3 }, 
      color: 'red' 
    }); // ✅ 옵션 필드 포함
    
    // 타입 에러가 발생해야 하는 경우들 (주석으로 표시)
    // await dispatch('updateScore'); // ❌ payload 누락
    // await dispatch('updateScore', { score: '100' }); // ❌ 잘못된 타입
    // await dispatch('spawnObject', { type: 'pyramid', position: { x: 0, y: 0, z: 0 } }); // ❌ 잘못된 enum
  };

  // RefManager 타입 검증
  const handleRefManager = async () => {
    // 전체 참조 상태 조회
    const allRefs = refManager.getAllRefs();
    const canvas: HTMLCanvasElement | undefined = allRefs.canvas;
    const scene: THREE.Scene | undefined = allRefs.gameScene;
    
    // 특정 참조들만 대기
    const specificRefs = await refManager.waitForRefs('canvas', 'gameScene');
    const waitedCanvas: HTMLCanvasElement = specificRefs.canvas;
    const waitedScene: THREE.Scene = specificRefs.gameScene;
    
    // withRefs로 여러 참조 동시 처리
    await refManager.withRefs(['canvas', 'scoreDisplay'], (refs) => {
      const canvas: HTMLCanvasElement = refs.canvas;
      const score: HTMLSpanElement = refs.scoreDisplay;
      
      // DOM 조작
      canvas.width = 800;
      score.textContent = 'Score: 100';
    });
  };

  return null; // 컴파일 테스트용
}

// ========================================
// 타입 추론 테스트 4: 커스텀 객체 참조
// ========================================

interface CustomAudioContext extends AudioContext {
  customProperty: string;
}

interface GameState {
  level: number;
  health: number;
  inventory: string[];
}

// 리네이밍 컨벤션: TestCustom 도메인
const { 
  Provider: TestCustomRefProvider,
  useRef: useTestCustomRef,
  useRefs: useTestCustomRefs 
} = createDeclarativeRefPattern('TestCustom', {
  audioContext: customRef<CustomAudioContext>({ 
    name: 'custom-audio-context' 
  }),
  gameState: customRef<GameState>({ 
    name: 'game-state' 
  }),
  videoElement: domRef<HTMLVideoElement>() // 혼합
});

function TestCustomTypeInference() {
  const audioContext = useTestCustomRef('audioContext');
  const gameState = useTestCustomRef('gameState');
  const videoElement = useTestCustomRef('videoElement');
  
  // 타입 검증
  const audioValue: CustomAudioContext | null = audioContext.target;
  const stateValue: GameState | null = gameState.target;
  const videoValue: HTMLVideoElement | null = videoElement.target;
  
  // 여러 커스텀 객체 처리
  const [audio, state, video] = useTestCustomRefs('audioContext', 'gameState', 'videoElement');
  const audioTarget: CustomAudioContext | null = audio.target;
  const stateTarget: GameState | null = state.target;
  const videoTarget: HTMLVideoElement | null = video.target;
  
  const handleCustomObjects = async () => {
    // CustomAudioContext 메서드/속성 접근
    await audioContext.withTarget((ctx) => {
      ctx.resume(); // AudioContext 메서드 ✅
      const customProp: string = ctx.customProperty; // 커스텀 속성 ✅
      const state: AudioContextState = ctx.state; // AudioContext 속성 ✅
    });

    // GameState 객체 조작
    await gameState.withTarget((state) => {
      state.level += 1; // 숫자 속성 ✅
      state.health -= 10;
      state.inventory.push('sword'); // 배열 메서드 ✅
      const items: string[] = state.inventory; // 정확한 배열 타입 ✅
    });

    // 혼합된 타입들 함께 처리
    const promises = [
      audioContext.withTarget(ctx => ctx.resume()),
      gameState.withTarget(state => { state.level = 1; }),
      videoElement.withTarget(video => { video.play(); })
    ];
    await Promise.all(promises);
  };

  return null; // 컴파일 테스트용
}

// ========================================
// 타입 추론 테스트 5: 헬퍼 함수들
// ========================================

// domRef 헬퍼 타입 검증
const inputRef = domRef<HTMLInputElement>({ name: 'test-input' });
const buttonRef = domRef<HTMLButtonElement>();
const divRef = domRef<HTMLDivElement>({ autoCleanup: false });

// Three.js 객체 헬퍼 타입 검증  
const sceneRef = {
  name: 'scene',
  objectType: 'custom' as const,
  validator: (target: unknown): target is ThreeScene =>
    typeof target === 'object' && target !== null && 
    (target as any).type === 'Scene'
} as RefInitConfig<ThreeScene>;

const meshRef = {
  name: 'mesh',
  objectType: 'custom' as const,
  validator: (target: unknown): target is ThreeMesh =>
    typeof target === 'object' && target !== null && 
    (target as any).type === 'Mesh'
} as RefInitConfig<ThreeMesh>;

// customRef 헬퍼 타입 검증
const audioRef = customRef<AudioContext>({ 
  name: 'audio', 
  cleanup: async (ctx) => { await ctx.close(); } 
});
const stateRef = customRef<{ count: number }>({ 
  name: 'state' 
});

// 헬퍼 함수들로 생성된 패턴 타입 검증 - 리네이밍 컨벤션
const { 
  Provider: TestHelpersRefProvider,
  useRef: useTestHelpersRef 
} = createDeclarativeRefPattern('TestHelpers', {
  input: inputRef,
  button: buttonRef,
  scene: sceneRef,
  audio: audioRef
});

function TestHelperTypeInference() {
  const input = useTestHelpersRef('input');
  const button = useTestHelpersRef('button');
  const scene = useTestHelpersRef('scene');
  const audio = useTestHelpersRef('audio');
  
  // 타입 검증
  const inputValue: HTMLInputElement | null = input.target;
  const buttonValue: HTMLButtonElement | null = button.target;
  const sceneValue: THREE.Scene | null = scene.target;
  const audioValue: AudioContext | null = audio.target;
  
  return null; // 컴파일 테스트용
}

// ========================================
// 컴포넌트 내보내기 (실제 테스트에서 사용)
// ========================================

export function DeclarativePatternTypeTests() {
  return (
    <div>
      <h2>선언적 패턴 타입 추론 테스트</h2>
      <p>이 컴포넌트는 TypeScript 컴파일 시 타입 안전성을 검증합니다.</p>
      <TestFormTypeInference />
      <TestThreeTypeInference />
      <TestIntegratedTypeInference />
      <TestCustomTypeInference />
      <TestHelperTypeInference />
    </div>
  );
}

export default DeclarativePatternTypeTests;