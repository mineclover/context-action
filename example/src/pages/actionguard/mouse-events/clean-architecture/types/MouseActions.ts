/**
 * Mouse Actions types for Clean Architecture pattern
 */

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseActions {
  mouseMove: {
    position: MousePosition;
    timestamp: number;
  };
  mouseClick: {
    position: MousePosition;
    button: number;
    timestamp: number;
  };
  mouseEnter: {
    position: MousePosition;
    timestamp: number;
  };
  mouseLeave: {
    position: MousePosition;
    timestamp: number;
  };
  moveEnd: {
    position: MousePosition;
    timestamp: number;
  };
  resetMouseState: void;
}
