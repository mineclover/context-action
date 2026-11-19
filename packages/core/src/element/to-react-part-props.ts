import type { ElementBindingConfig } from './contracts.js';

const ATTR_TO_REACT_PROP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
};

function toReactStyleProperty(cssProperty: string): string {
  if (cssProperty.startsWith('--')) return cssProperty;
  return cssProperty.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

/**
 * Projects a headless part snapshot into React 19 JSX props using an ElementBindingConfig.
 */
export function toReactPartProps<Props extends object>(
  snapshot: Props,
  config: ElementBindingConfig<Props> = {},
): Record<string, unknown> {
  const reactProps: Record<string, unknown> = {};
  const attrEntries = Object.entries(config.attributes ?? {}) as [string, string | undefined][];
  const styleEntries = Object.entries(config.styles ?? {}) as [string, string | undefined][];
  const eventMap = config.events ?? {};
  const record = snapshot as Record<string, unknown>;

  for (const [propKey, attrName] of attrEntries) {
    if (!attrName) continue;
    const value = record[propKey];
    if (value === undefined || value === null || value === false) continue;
    const reactKey = ATTR_TO_REACT_PROP[attrName] ?? attrName;
    reactProps[reactKey] = value === true ? '' : value;
  }

  const styleObj: Record<string, string> = {};
  let hasStyle = false;
  for (const [propKey, cssProperty] of styleEntries) {
    if (!cssProperty) continue;
    const value = record[propKey];
    if (value === undefined || value === null || value === '') continue;
    styleObj[toReactStyleProperty(cssProperty)] = String(value);
    hasStyle = true;
  }
  if (hasStyle) reactProps.style = styleObj;

  for (const propKey of Object.keys(eventMap)) {
    const candidate = record[propKey];
    if (typeof candidate === 'function') {
      reactProps[propKey] = candidate;
    }
  }

  return reactProps;
}
