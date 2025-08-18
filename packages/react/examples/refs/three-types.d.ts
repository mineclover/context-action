/**
 * Three.js 타입 정의
 * 
 * @types/three가 devDependencies로 설치되어 있습니다.
 * 실제 프로젝트에서는 다음과 같이 import하여 사용하세요:
 * 
 * import * as THREE from 'three';
 * 
 * 또는 개별 클래스 import:
 * import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, etc. } from 'three';
 */

// Re-export Three.js types for convenience in examples
import * as THREE from 'three';

// Global THREE namespace for compatibility with existing examples
declare global {
  namespace THREE {
    export type Scene = import('three').Scene;
    export type PerspectiveCamera = import('three').PerspectiveCamera;
    export type WebGLRenderer = import('three').WebGLRenderer;
    export type Mesh = import('three').Mesh;
    export type BufferGeometry = import('three').BufferGeometry;
    export type BoxGeometry = import('three').BoxGeometry;
    export type SphereGeometry = import('three').SphereGeometry;
    export type Material = import('three').Material;
    export type MeshBasicMaterial = import('three').MeshBasicMaterial;
    export type Vector3 = import('three').Vector3;
    export type Euler = import('three').Euler;
    export type Color = import('three').Color;
    export type Light = import('three').Light;
    export type Object3D = import('three').Object3D;
    
    // Constructor exports
    export const Scene: typeof import('three').Scene;
    export const PerspectiveCamera: typeof import('three').PerspectiveCamera;
    export const WebGLRenderer: typeof import('three').WebGLRenderer;
    export const Mesh: typeof import('three').Mesh;
    export const BoxGeometry: typeof import('three').BoxGeometry;
    export const SphereGeometry: typeof import('three').SphereGeometry;
    export const MeshBasicMaterial: typeof import('three').MeshBasicMaterial;
    export const Vector3: typeof import('three').Vector3;
  }
}