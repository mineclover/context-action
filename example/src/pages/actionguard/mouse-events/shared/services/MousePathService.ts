/**
 * Mouse Path Service - Simplified
 */

export interface MousePathService {
  trackPath: (x: number, y: number) => void;
  getPath: () => Array<{x: number, y: number}>;
}

export const createMousePathService = (): MousePathService => {
  const path: Array<{x: number, y: number}> = [];

  return {
    trackPath: (x: number, y: number) => {
      path.push({ x, y });
    },
    getPath: () => [...path]
  };
};

export default createMousePathService;