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

// Projected Order Reference Mount
import('./projected-order/index.js').then(({ createOrderModel, mountOrderWorkspace }) => {
  const orderHost = document.querySelector<HTMLElement>('#order-workspace-host');
  if (orderHost) {
    const orderModel = createOrderModel({
      customerName: '홍길동',
      shippingAddress: '서울특별시 강남구 테헤란로 123',
      items: [
        { id: 'item_1', name: 'TypeScript 완벽 가이드', unitPrice: 32, quantity: 1 },
        { id: 'item_2', name: 'Preact & Signals 마스터북', unitPrice: 28, quantity: 2 },
      ],
    });
    scope.add(() => orderModel.destroy());
    const orderMount = mountOrderWorkspace(orderHost, orderModel);
    scope.add(() => orderMount.destroy());
  }
});

window.addEventListener('pagehide', (event) => {
  if (event.persisted) return; // Preserve the demo when restored from BFCache.
  scope.dispose();
  element.remove();
});
