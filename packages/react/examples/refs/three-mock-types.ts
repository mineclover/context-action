/**
 * @fileoverview Three.js Mock Types for Examples
 * 
 * 라이브러리 코드에서 분리된 Three.js 목 타입들
 * 실제 프로덕션에서는 실제 Three.js 타입을 사용하세요
 */

/**
 * Three.js 타입 정의 (목 타입)
 */
export interface ThreeObject {
  type: string;
  uuid?: string;
  name?: string;
  parent?: ThreeObject | null;
  children?: ThreeObject[];
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  visible?: boolean;
  dispose?(): void;
}

export interface ThreeScene extends ThreeObject {
  type: 'Scene';
  children: ThreeObject[];
  add: (object: ThreeObject) => void;
  remove: (object: ThreeObject) => void;
}

export interface ThreeCamera extends ThreeObject {
  type: 'PerspectiveCamera' | 'OrthographicCamera';
  position: { x: number; y: number; z: number };
  lookAt?(x: number, y: number, z: number): void;
}

export interface ThreeRenderer extends ThreeObject {
  type: 'WebGLRenderer';
  domElement: HTMLCanvasElement;
  setSize: (width: number, height: number) => void;
  render?(scene: ThreeScene, camera: ThreeCamera): void;
  dispose: () => void;
  forceContextLoss?(): void;
}

export interface ThreeMesh extends ThreeObject {
  type: 'Mesh';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  geometry?: { dispose(): void };
  material?: { dispose(): void } | { dispose(): void }[];
}

/**
 * Three.js 객체 타입 검증기들 (목 구현)
 */
export const ThreeValidators = {
  Scene: {
    validate: (target: unknown): target is ThreeScene => 
      typeof target === 'object' && target !== null && 
      (target as ThreeObject).type === 'Scene',
    expectedType: 'THREE.Scene'
  },
  Camera: {
    validate: (target: unknown): target is ThreeCamera => 
      typeof target === 'object' && target !== null && 
      ((target as ThreeObject).type === 'PerspectiveCamera' || 
       (target as ThreeObject).type === 'OrthographicCamera'),
    expectedType: 'THREE.Camera'
  },
  Renderer: {
    validate: (target: unknown): target is ThreeRenderer => 
      typeof target === 'object' && target !== null && 
      (target as ThreeObject).type === 'WebGLRenderer',
    expectedType: 'THREE.WebGLRenderer'
  },
  Mesh: {
    validate: (target: unknown): target is ThreeMesh => 
      typeof target === 'object' && target !== null && 
      (target as ThreeObject).type === 'Mesh',
    expectedType: 'THREE.Mesh'
  }
} as const;