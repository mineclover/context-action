/**
 * @fileoverview Three.js Reference Context Factory
 * 
 * Three.js 객체 전용 참조 컨텍스트 생성 팩토리 함수
 */

import { createDeclarativeRefPattern } from './declarative-ref-pattern';
import { threeRef } from './helpers';
import type { DeclarativeRefContextReturn, ThreeRefTarget } from './declarative-ref-pattern';

/**
 * Three.js 전용 참조 컨텍스트 생성 (편의 함수)
 * 
 * @param contextName 컨텍스트 이름
 * @param refConfigs Three.js 객체 설정
 * @returns Three.js 전용 참조 컨텍스트
 * 
 * @example
 * ```typescript
 * import { createThreeRefContext } from '@context-action/react/refs/three-ref-context';
 * 
 * interface ThreeObjects {
 *   scene: THREE.Scene;
 *   camera: THREE.Camera;
 *   renderer: THREE.WebGLRenderer;
 * }
 * 
 * const ThreeRefs = createThreeRefContext<ThreeObjects>('GameGraphics', {
 *   scene: { 
 *     name: 'scene',
 *     cleanup: async (scene) => {
 *       scene.clear();
 *     }
 *   },
 *   camera: { name: 'camera' },
 *   renderer: { 
 *     name: 'renderer',
 *     cleanup: async (renderer) => {
 *       renderer.dispose();
 *     }
 *   }
 * });
 * 
 * function ThreeScene() {
 *   const scene = ThreeRefs.useRef('scene');
 *   const camera = ThreeRefs.useRef('camera');
 *   const renderer = ThreeRefs.useRef('renderer');
 * 
 *   const initializeScene = async () => {
 *     const [sceneObj, cameraObj, rendererObj] = await Promise.all([
 *       scene.waitForMount(),
 *       camera.waitForMount(), 
 *       renderer.waitForMount()
 *     ]);
 * 
 *     const geometry = new THREE.BoxGeometry();
 *     const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
 *     const cube = new THREE.Mesh(geometry, material);
 *     
 *     sceneObj.add(cube);
 *     rendererObj.render(sceneObj, cameraObj);
 *   };
 * 
 *   return (
 *     <ThreeRefs.Provider>
 *       <button onClick={initializeScene}>Initialize Scene</button>
 *     </ThreeRefs.Provider>
 *   );
 * }
 * ```
 */
export function createThreeRefContext<T extends Record<string, ThreeRefTarget>>(
  contextName: string,
  refConfigs: {
    [K in keyof T]: {
      name: string;
      expectedType?: string;
      autoAddToScene?: boolean;
      autoDispose?: boolean;
      autoCleanupResources?: boolean;
      cleanup?: (target: T[K]) => void | Promise<void>;
    }
  }
): DeclarativeRefContextReturn<{
  [K in keyof T]: ReturnType<typeof threeRef>
}> {
  const refDefinitions = {} as any;
  
  Object.entries(refConfigs).forEach(([refName, config]) => {
    refDefinitions[refName] = threeRef<T[keyof T]>({
      ...config as any,
      name: config.name
    });
  });
  
  return createDeclarativeRefPattern(contextName, refDefinitions);
}