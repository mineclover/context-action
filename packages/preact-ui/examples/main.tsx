import { createDisposalScope } from '../src/index.js';
import { createCounterModel } from './shared/counter-model.js';
import { mountCounter } from './template-island/mount-counter.js';
import { defineCounterElement } from './web-component/counter-element.js';

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

const scope = createDisposalScope();
const model = createCounterModel();
scope.add(() => model.destroy());
const template = required<HTMLTemplateElement>('#counter-template');
for (const [selector, label] of [['#island-a', 'Panel A'], ['#island-b', 'Panel B']] as const) {
  const panel = mountCounter(required<HTMLElement>(selector), template, model, label);
  scope.add(() => panel.destroy());
}
required('#destroy-islands').addEventListener('click', () => scope.dispose(), { once: true });

const CounterElement = defineCounterElement();
const element = new CounterElement();
element.value = 10;
const host = required<HTMLElement>('#custom-element-host');
host.append(element);
element.addEventListener('value-change', () => {
  required('#event-log').textContent = `Web Component value: ${element.value}`;
});
required('#toggle-element').addEventListener('click', () => {
  if (element.isConnected) element.remove();
  else host.append(element);
});
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return; // Preserve the demo when restored from BFCache.
  scope.dispose();
  element.remove();
});
