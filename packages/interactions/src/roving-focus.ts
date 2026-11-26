export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both';
export type RovingFocusDirection = 'next' | 'prev' | 'first' | 'last';

export interface RovingFocusItem {
  readonly id: string;
  readonly disabled?: boolean | undefined;
  readonly label?: string | undefined;
}

export interface RovingFocusKeyEventLike {
  readonly key: string;
  readonly ctrlKey?: boolean | undefined;
  readonly metaKey?: boolean | undefined;
  readonly altKey?: boolean | undefined;
  preventDefault?(): void;
}

export interface RovingFocusOptions {
  readonly orientation?: RovingFocusOrientation | undefined;
  readonly loop?: boolean | undefined;
  readonly typeahead?: boolean | undefined;
  readonly typeaheadTimeoutMs?: number | undefined;
  getItems(): readonly RovingFocusItem[];
  getActiveId(): string | null | undefined;
  onFocusChange?: ((nextId: string) => void) | undefined;
}

export interface RovingFocusController {
  getTabIndex(itemId: string): 0 | -1;
  getActiveDescendant(idPrefix?: string): string | undefined;
  move(direction: RovingFocusDirection, currentId?: string | null): string | null;
  handleKeyDown(currentId: string | null | undefined, event: RovingFocusKeyEventLike): string | null;
  resetTypeahead(): void;
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

function findMatchingItem(
  enabled: readonly RovingFocusItem[],
  prefix: string,
  startIndex: number,
): RovingFocusItem | undefined {
  const len = enabled.length;
  if (len === 0 || prefix.length === 0) return undefined;
  const normalizedStart = ((startIndex % len) + len) % len;
  for (let offset = 0; offset < len; offset += 1) {
    const candidate = enabled[(normalizedStart + offset) % len];
    if (!candidate?.label) continue;
    if (candidate.label.trim().toLowerCase().startsWith(prefix)) {
      return candidate;
    }
  }
  return undefined;
}

export function createRovingFocusController(options: RovingFocusOptions): RovingFocusController {
  const orientation: RovingFocusOrientation = options.orientation ?? 'horizontal';
  const loop = options.loop ?? true;
  const typeahead = options.typeahead ?? false;
  const typeaheadTimeoutMs = options.typeaheadTimeoutMs ?? 500;

  let typeaheadBuffer = '';
  let lastTypedAt = 0;

  const getEnabledItems = (): readonly RovingFocusItem[] =>
    options.getItems().filter(item => !item.disabled);

  const resolveEffectiveActiveId = (enabled: readonly RovingFocusItem[]): string | null => {
    if (enabled.length === 0) return null;
    const requested = options.getActiveId();
    if (requested && enabled.some(item => item.id === requested)) return requested;
    return enabled[0]?.id ?? null;
  };

  const resolveBaselineIndex = (
    enabled: readonly RovingFocusItem[],
    currentId?: string | null,
  ): number => {
    const requested = currentId !== undefined ? currentId : options.getActiveId();
    if (requested) {
      const idx = enabled.findIndex(item => item.id === requested);
      if (idx >= 0) return idx;
    }
    const active = options.getActiveId();
    if (active) {
      return enabled.findIndex(item => item.id === active);
    }
    return -1;
  };

  const move = (
    direction: RovingFocusDirection,
    currentId?: string | null,
  ): string | null => {
    const enabled = getEnabledItems();
    if (enabled.length === 0) return null;

    let target: RovingFocusItem | undefined;
    if (direction === 'first') {
      target = enabled[0];
    } else if (direction === 'last') {
      target = enabled[enabled.length - 1];
    } else {
      const idx = resolveBaselineIndex(enabled, currentId);
      if (idx < 0) {
        target = direction === 'next' ? enabled[0] : enabled[enabled.length - 1];
      } else {
        const step = direction === 'next' ? 1 : -1;
        const nextIdx = loop
          ? (idx + step + enabled.length) % enabled.length
          : Math.max(0, Math.min(enabled.length - 1, idx + step));
        target = enabled[nextIdx];
      }
    }

    if (!target) return null;
    options.onFocusChange?.(target.id);
    return target.id;
  };

  const resetTypeahead = (): void => {
    typeaheadBuffer = '';
    lastTypedAt = 0;
  };

  return {
    getTabIndex(itemId) {
      const enabled = getEnabledItems();
      const effectiveId = resolveEffectiveActiveId(enabled);
      return effectiveId !== null && itemId === effectiveId ? 0 : -1;
    },
    getActiveDescendant(idPrefix = '') {
      const enabled = getEnabledItems();
      const requested = options.getActiveId();
      if (!requested) return undefined;
      return enabled.some(item => item.id === requested) ? `${idPrefix}${requested}` : undefined;
    },
    move,
    resetTypeahead,
    handleKeyDown(currentId, event) {
      if (event.key === 'Home') {
        const nextId = move('first', currentId);
        if (nextId !== null) event.preventDefault?.();
        return nextId;
      }
      if (event.key === 'End') {
        const nextId = move('last', currentId);
        if (nextId !== null) event.preventDefault?.();
        return nextId;
      }
      if (isForwardKey(event.key, orientation)) {
        const nextId = move('next', currentId);
        if (nextId !== null) event.preventDefault?.();
        return nextId;
      }
      if (isBackwardKey(event.key, orientation)) {
        const nextId = move('prev', currentId);
        if (nextId !== null) event.preventDefault?.();
        return nextId;
      }

      if (!typeahead || event.ctrlKey || event.metaKey || event.altKey) {
        return null;
      }
      if (event.key.length !== 1) return null;
      if (event.key === ' ' && typeaheadBuffer.length === 0) return null;

      const enabled = getEnabledItems();
      if (enabled.length === 0) return null;

      const now = Date.now();
      if (now - lastTypedAt > typeaheadTimeoutMs) {
        typeaheadBuffer = '';
      }
      lastTypedAt = now;

      const char = event.key.toLowerCase();
      const curIdx = resolveBaselineIndex(enabled, currentId);

      let match: RovingFocusItem | undefined;
      if (typeaheadBuffer.length === 1 && typeaheadBuffer === char) {
        match = findMatchingItem(enabled, char, curIdx >= 0 ? curIdx + 1 : 0);
      } else {
        const nextBuffer = typeaheadBuffer + char;
        const startIdx =
          nextBuffer.length === 1
            ? curIdx >= 0
              ? curIdx + 1
              : 0
            : Math.max(curIdx, 0);
        match = findMatchingItem(enabled, nextBuffer, startIdx);
        if (match) {
          typeaheadBuffer = nextBuffer;
        } else if (typeaheadBuffer.length > 0) {
          match = findMatchingItem(enabled, char, curIdx >= 0 ? curIdx + 1 : 0);
          typeaheadBuffer = match ? char : '';
        } else {
          typeaheadBuffer = '';
        }
      }

      if (!match) return null;
      event.preventDefault?.();
      options.onFocusChange?.(match.id);
      return match.id;
    },
  };
}
