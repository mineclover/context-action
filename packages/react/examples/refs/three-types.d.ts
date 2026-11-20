/**
 * Three.js 호환 목(Mock) 전역 타입 정의
 *
 * 실제 Three.js를 사용하는 프로젝트에서는 `three`와 `@types/three`를 설치한 뒤
 * 다음과 같이 직접 import하여 사용하세요:
 *
 * ```ts
 * import * as THREE from 'three';
 * ```
 */

import type {
  ThreeCamera,
  ThreeMesh,
  ThreeObject,
  ThreeRenderer,
  ThreeScene,
} from './three-mock-types';

declare global {
  namespace THREE {
    export type Scene = ThreeScene;
    export type PerspectiveCamera = ThreeCamera;
    export type WebGLRenderer = ThreeRenderer;
    export type Mesh = ThreeMesh;
    export type Object3D = ThreeObject;
  }
}