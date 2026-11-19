export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both';

export interface RovingFocusItem {
  readonly id: string;
  readonly disabled?: boolean | undefined;
}

export interface RovingFocusKeyEventLike {
  readonly key: string;
  preventDefault?(): void;
}

export interface RovingFocusOptions {
  readonly orientation?: RovingFocusOrientation | undefined;
  readonly loop?: boolean | undefined;
  getItems(): readonly RovingFocusItem[];
  getActiveId(): string | null | undefined;
  onFocusChange?: ((nextId: string) => void) | undefined;
}

export interface RovingFocusController {
  getTabIndex(itemId: string): 0 | -1;
  handleKeyDown(currentId: string, event: RovingFocusKeyEventLike): string | null;
}

function isForwardKey(key: string, orientation: RovingFocusOrientation): boolean {
  if (orientation === 'horizontal') return key === 'ArrowRight';
  if (orientation === 'vertical') return key === 'ArrowDown';
  return key === 'ArrowRight' || key === 'ArrowDown';
}

function isBackwardKey(key: string, orientation: RovingFocusOrientation): boolean {
  if (orientation === 'horizontal') return key === 'ArrowLeft';
  if (orientation === 'vertical') return key === 'ArrowUp';
  return key === 'ArrowLeft' || key === 'ArrowUp';
}

export function createRovingFocusController(options: RovingFocusOptions): RovingFocusController {
  const orientation: RovingFocusOrientation = options.orientation ?? 'horizontal';
  const loop = options.loop ?? true;

  const getEnabledItems = (): readonly RovingFocusItem[] =>
    options.getItems().filter(item => !item.disabled);

  const resolveEffectiveActiveId = (enabled: readonly RovingFocusItem[]): string | null => {
    if (enabled.length === 0) return null;
    const requested = options.getActiveId();
    if (requested && enabled.some(item => item.id === requested)) return requested;
    return enabled[0]?.id ?? null;
  };

  return {
    getTabIndex(itemId) {
      const enabled = getEnabledItems();
      const effectiveId = resolveEffectiveActiveId(enabled);
      return effectiveId !== null && itemId === effectiveId ? 0 : -1;
    },
    handleKeyDown(currentId, event) {
      const enabled = getEnabledItems();
      if (enabled.length === 0) return null;

      let target: RovingFocusItem | undefined;
      if (event.key === 'Home') {
        target = enabled[0];
      } else if (event.key === 'End') {
        target = enabled[enabled.length - 1];
      } else if (isForwardKey(event.key, orientation) || isBackwardKey(event.key, orientation)) {
        const step = isForwardKey(event.key, orientation) ? 1 : -1;
        const effectiveId = resolveEffectiveActiveId(enabled);
        let idx = enabled.findIndex(item => item.id === currentId);
        if (idx < 0 && effectiveId !== null) {
          idx = enabled.findIndex(item => item.id === effectiveId);
        }
        if (idx < 0) idx = 0;
        const nextIdx = loop
          ? (idx + step + enabled.length) % enabled.length
          : Math.max(0, Math.min(enabled.length - 1, idx + step));
        target = enabled[nextIdx];
      } else {
        return null;
      }

      if (!target) return null;
      event.preventDefault?.();
      options.onFocusChange?.(target.id);
      return target.id;
    },
  };
}
