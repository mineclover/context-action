/** Consumer contract: renderer types stay in internal modules. */
export interface LayerItem {
  readonly id: string;
  readonly name: string;
}

export interface LayerPanelContract {
  items: readonly LayerItem[];
  selectedId: string | null;
  disabled: boolean;
  /** Current committed DOM only. Does not change selection. */
  focusItem(id: string): boolean;
}

export type LayerPanelElement = HTMLElement & LayerPanelContract;

export interface SelectionRequestDetail {
  readonly id: string;
}

export interface LayerPanelEventMap {
  'selection-request': CustomEvent<SelectionRequestDetail>;
}

export interface LayerPanelInput {
  readonly items?: readonly LayerItem[];
  readonly selectedId?: string | null;
  readonly disabled?: boolean;
}

export interface LayerPanelMount extends LayerPanelContract {
  /** Terminal and idempotent; retains the last readable snapshot. */
  destroy(): void;
}
