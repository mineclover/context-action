/**
 * @fileoverview Reference implementation of <lit-cart-badge> custom element.
 * Demonstrates dual-mode store subscription (direct property vs W3C Context Protocol),
 * selective projection for total count, coalesced pending state tracking,
 * and zero-memory-leak unmounting.
 *
 * @implements view-layer
 * @implements store-integration-pattern
 * @implements action-pipeline-system
 * @memberof core-concepts
 */

import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Context } from '@lit/context';
import type { ActionRegister } from '@context-action/core';
import {
  StoreController,
  ActionController,
  type ReadableStore,
  type Selector,
  type EqualityFn,
} from '@context-action/lit';
import {
  createStoreContext,
  ContextStoreController,
  ContextActionController,
  actionRegisterContext,
} from '../context.js';

/**
 * Standard W3C Context token for the shopping cart domain store.
 * Uses Symbol.for to guarantee singleton identity across independent bundle chunks.
 */
export const cartStoreContext: Context<symbol, ReadableStore<any>> =
  createStoreContext<any>('cart');

/**
 * Custom event detail emitted when the cart badge button is clicked.
 */
export interface CartBadgeClickEventDetail {
  count: number;
  isPending: boolean;
}

/**
 * Default projection selector that extracts total quantity from diverse cart store state structures:
 * - Primitive numbers (e.g. `5`)
 * - State objects with `totalCount`, `count`, or `total` numerical fields
 * - State objects with `items` arrays containing quantity numbers or objects (`{ quantity: n }`)
 */
export function defaultCartCountSelector(state: unknown): number {
  if (typeof state === 'number') {
    return Number.isFinite(state) ? Math.max(0, Math.floor(state)) : 0;
  }
  if (state && typeof state === 'object') {
    const obj = state as Record<string, any>;
    if (typeof obj.totalCount === 'number' && Number.isFinite(obj.totalCount)) {
      return Math.max(0, Math.floor(obj.totalCount));
    }
    if (typeof obj.count === 'number' && Number.isFinite(obj.count)) {
      return Math.max(0, Math.floor(obj.count));
    }
    if (typeof obj.total === 'number' && Number.isFinite(obj.total)) {
      return Math.max(0, Math.floor(obj.total));
    }
    if (Array.isArray(obj.items)) {
      return obj.items.reduce((sum: number, item: any) => {
        const qty =
          typeof item === 'number'
            ? item
            : typeof item?.quantity === 'number'
            ? item.quantity
            : 1;
        return sum + (Number.isFinite(qty) ? Math.max(0, qty) : 0);
      }, 0);
    }
  }
  return 0;
}

/**
 * Reference Custom Element for displaying a dynamic shopping cart badge.
 *
 * Supports two consumption paradigms:
 * 1. Direct property assignment: `.store=${cartStore}` and `.register=${actionRegister}`.
 * 2. W3C Context Protocol: automatically injects `cartStoreContext` and `actionRegisterContext`
 *    from ancestor providers across Shadow DOM boundaries.
 */
@customElement('lit-cart-badge')
export class LitCartBadge extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      font-family: var(
        --cart-badge-font-family,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif
      );
      --_bg: var(--cart-badge-bg, #2563eb);
      --_color: var(--cart-badge-color, #ffffff);
      --_hover-bg: var(--cart-badge-hover-bg, #1d4ed8);
      --_active-bg: var(--cart-badge-active-bg, #1e40af);
      --_radius: var(--cart-badge-radius, 9999px);
      --_font-size: var(--cart-badge-font-size, 0.875rem);
      --_font-weight: var(--cart-badge-font-weight, 600);
      --_padding: var(--cart-badge-padding, 4px 10px);
      --_pulse-scale: var(--cart-badge-pulse-scale, 1.2);
    }

    :host([variant='secondary']) {
      --_bg: var(--cart-badge-bg, #475569);
      --_hover-bg: var(--cart-badge-hover-bg, #334155);
      --_active-bg: var(--cart-badge-active-bg, #1e293b);
    }

    :host([variant='accent']) {
      --_bg: var(--cart-badge-bg, #7c3aed);
      --_hover-bg: var(--cart-badge-hover-bg, #6d28d9);
      --_active-bg: var(--cart-badge-active-bg, #5b21b6);
    }

    :host([variant='danger']) {
      --_bg: var(--cart-badge-bg, #dc2626);
      --_hover-bg: var(--cart-badge-hover-bg, #b91c1c);
      --_active-bg: var(--cart-badge-active-bg, #991b1b);
    }

    :host([hidden]) {
      display: none !important;
    }

    :host([hide-zero][count-zero]) {
      display: none !important;
    }

    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
      cursor: not-allowed;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: var(--_padding);
      background-color: var(--_bg);
      color: var(--_color);
      border-radius: var(--_radius);
      font-size: var(--_font-size);
      font-weight: var(--_font-weight);
      border: none;
      cursor: pointer;
      user-select: none;
      outline: none;
      transition: background-color 0.15s ease, transform 0.15s ease;
      box-sizing: border-box;
      line-height: 1;
    }

    .badge:hover:not(:disabled) {
      background-color: var(--_hover-bg);
    }

    .badge:active:not(:disabled) {
      background-color: var(--_active-bg);
    }

    .badge:focus-visible {
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
    }

    .badge:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25em;
      font-variant-numeric: tabular-nums;
    }

    .pulse {
      animation: cart-badge-pulse 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes cart-badge-pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(var(--_pulse-scale));
      }
      100% {
        transform: scale(1);
      }
    }

    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: cart-badge-spin 0.8s linear infinite;
      box-sizing: border-box;
    }

    @keyframes cart-badge-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  /**
   * Explicit ReadableStore instance passed directly to this component.
   * If provided, overrides context-based store resolution.
   */
  @property({ attribute: false })
  store?: ReadableStore<any>;

  /**
   * Explicit ActionRegister instance passed directly to this component.
   * If provided, overrides context-based action register resolution.
   */
  @property({ attribute: false })
  register?: ActionRegister<any>;

  /**
   * Custom projection selector for deriving the total quantity from store state.
   */
  @property({ attribute: false })
  selector?: Selector<any, number>;

  /**
   * Custom equality comparator function used for selective projection memoization.
   */
  @property({ attribute: false })
  equalityFn?: EqualityFn<number>;

  /**
   * Optional custom W3C Context token for resolving a cart store from ancestor providers.
   */
  @property({ attribute: false })
  storeContext?: Context<unknown, ReadableStore<any>>;

  /**
   * Optional custom W3C Context token for resolving an ActionRegister from ancestor providers.
   */
  @property({ attribute: false })
  actionContext?: Context<unknown, ActionRegister<any>>;

  /**
   * Static numerical count override. If defined, overrides both store and context values.
   */
  @property({ type: Number })
  value?: number;

  /**
   * Maximum count displayed before truncating with a '+' suffix (e.g. 99 -> '99+').
   */
  @property({ type: Number, attribute: 'max-count' })
  maxCount = 99;

  /**
   * When true, hides the badge completely when count is 0.
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-zero' })
  hideZero = false;

  /**
   * Label text rendered next to the count. Defaults to 'Cart'.
   */
  @property({ type: String })
  label = 'Cart';

  /**
   * Optional action name dispatched on click through the configured ActionRegister.
   */
  @property({ type: String, attribute: 'action-name' })
  actionName?: string;

  /**
   * Optional payload passed when dispatching actionName.
   */
  @property({ attribute: false })
  actionPayload?: unknown;

  /**
   * Whether the badge button is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Visual variant: 'primary' | 'secondary' | 'accent' | 'danger'
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'accent' | 'danger' = 'primary';

  @state()
  private isPulsing = false;

  // Controllers
  #contextStoreController: ContextStoreController<any, number>;
  #contextActionController: ContextActionController<any>;
  #directStoreController: StoreController<any, number> | null = null;
  #directActionController: ActionController<any> | null = null;

  #previousCount?: number;

  constructor() {
    super();

    // Initialize context controllers to listen across Shadow DOM
    this.#contextStoreController = new ContextStoreController(this, {
      context: cartStoreContext,
      selector: (state) =>
        this.selector ? this.selector(state) : defaultCartCountSelector(state),
      equalityFn: (a, b) => (this.equalityFn ? this.equalityFn(a, b) : Object.is(a, b)),
    });

    this.#contextActionController = new ContextActionController(this, {
      context: actionRegisterContext,
    });
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);

    // Sync direct store controller when store property changes
    if (changedProperties.has('store') || changedProperties.has('selector') || changedProperties.has('equalityFn')) {
      if (this.#directStoreController) {
        this.#directStoreController.dispose();
        this.#directStoreController = null;
      }

      if (this.store) {
        this.#directStoreController = new StoreController(this, this.store, {
          selector: (state) =>
            this.selector ? this.selector(state) : defaultCartCountSelector(state),
          equalityFn: this.equalityFn ?? Object.is,
        });
      }
    }

    // Sync direct action controller when register property changes
    if (changedProperties.has('register')) {
      if (this.register) {
        this.#directActionController = new ActionController(this, this.register);
      } else {
        this.#directActionController = null;
      }
    }
    // Track count and pulse animation
    const currentCount = this.count;
    if (this.#previousCount !== undefined && currentCount > this.#previousCount) {
      this.isPulsing = true;
    }
    this.#previousCount = currentCount;
  }

  /**
   * Derives the current total count from direct override, direct store, or context store.
   */
  get count(): number {
    if (this.value !== undefined) {
      return this.value;
    }
    if (this.#directStoreController) {
      return this.#directStoreController.value;
    }
    if (this.store) {
      const raw =
        typeof this.store.getValue === 'function'
          ? this.store.getValue()
          : typeof this.store.getSnapshot === 'function'
          ? this.store.getSnapshot()
          : undefined;
      return this.selector ? this.selector(raw) : defaultCartCountSelector(raw);
    }
    if (
      this.#contextStoreController.isResolved &&
      this.#contextStoreController.value !== undefined
    ) {
      return this.#contextStoreController.value;
    }
    return 0;
  }

  set count(val: number | undefined) {
    const oldVal = this.count;
    if (val === undefined || val === null) {
      this.value = undefined;
    } else {
      this.value = Number.isFinite(val) ? Math.max(0, Math.floor(val)) : 0;
    }
    this.requestUpdate('count', oldVal);
  }

  /**
   * Indicates whether an action dispatch is currently in flight.
   */
  get isPending(): boolean {
    if (this.#directActionController) {
      return this.#directActionController.isPending;
    }
    return this.#contextActionController.isPending;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    const currentCount = this.count;
    // Reflect helper attributes for consumer CSS queries
    this.toggleAttribute('has-items', currentCount > 0);
    this.toggleAttribute('count-zero', currentCount === 0);
  }

  #handleClick = async (): Promise<void> => {
    if (this.disabled || this.isPending) return;

    // Dispatch standard DOM event across Shadow DOM
    this.dispatchEvent(
      new CustomEvent<CartBadgeClickEventDetail>('cart-badge-click', {
        bubbles: true,
        composed: true,
        detail: {
          count: this.count,
          isPending: this.isPending,
        },
      })
    );

    // If an action name is configured, dispatch through the active action pipeline
    if (this.actionName) {
      try {
        if (this.#directActionController) {
          await this.#directActionController.dispatch(
            this.actionName,
            this.actionPayload as any
          );
        } else if (this.#contextActionController.register) {
          await this.#contextActionController.dispatch(
            this.actionName,
            this.actionPayload as any
          );
        }
      } catch (error) {
        this.dispatchEvent(
          new CustomEvent('cart-action-error', {
            bubbles: true,
            composed: true,
            detail: { error },
          })
        );
      }
    }
  };

  override render() {
    const current = this.count;
    if (this.hideZero && current <= 0) {
      return nothing;
    }

    const pending = this.isPending;
    const displayCount =
      current > this.maxCount ? `${this.maxCount}+` : String(current);

    return html`
      <button
        type="button"
        part="button badge"
        class="badge ${this.isPulsing ? 'pulse' : ''}"
        ?disabled=${this.disabled || pending}
        @click=${this.#handleClick}
        @animationend=${() => {
          this.isPulsing = false;
        }}
        aria-label=${this.getAttribute('aria-label') ||
        `${this.label}: ${displayCount} items`}
      >
        <slot name="icon">
          <span part="icon" class="icon" aria-hidden="true">🛒</span>
        </slot>
        <span part="label" class="label"><slot>${this.label}</slot></span>
        <span part="count" class="count">${displayCount}</span>
        ${pending
          ? html`<span
              part="spinner"
              class="spinner"
              aria-label="Loading"
            ></span>`
          : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-cart-badge': LitCartBadge;
  }
}
