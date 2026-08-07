export interface FrameHandle {
  cancel(): void;
}

/** Schedule a batched store notification in browsers and DOM-free runtimes. */
export function scheduleFrame(callback: (timestamp: number) => void): FrameHandle {
  const animationFrameHost =
    typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
      ? window
      : globalThis;

  if (typeof animationFrameHost.requestAnimationFrame === 'function') {
    const id = animationFrameHost.requestAnimationFrame(callback);
    return {
      cancel: () => animationFrameHost.cancelAnimationFrame?.(id),
    };
  }

  const id = setTimeout(() => callback(Date.now()), 0);
  return { cancel: () => clearTimeout(id) };
}
