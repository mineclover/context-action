import type { LayerPanelSnapshot } from './controller.js';

export interface LayerPanelViewInput extends LayerPanelSnapshot {
  onRequestSelect(id: string): void;
  itemRef(id: string, button: HTMLButtonElement | null): void;
}

/** Author-only props and refs. The same View works with either host adapter. */
export function LayerPanelView({ input }: { input: LayerPanelViewInput }) {
  return (
    <>
      <ul part="list" aria-label="레이어">
        {input.items.map(item => (
          <li key={item.id}>
            <button
              ref={button => input.itemRef(item.id, button)}
              part="item"
              type="button"
              disabled={input.disabled}
              aria-pressed={input.selectedId === item.id}
              onClick={() => input.onRequestSelect(item.id)}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
      <slot name="suffix" part="suffix" />
    </>
  );
}
