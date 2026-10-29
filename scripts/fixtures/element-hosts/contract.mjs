import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent', 'customElements', 'Document', 'DocumentFragment', 'Text', 'Comment', 'SVGElement', 'HTMLSlotElement', 'HTMLInputElement', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
class Probe extends HTMLElement {
  #input = { count: 7 };
  get input() { return this.#input; }
  set input(value) {
    if (value !== undefined && (!Number.isSafeInteger(value.count) || value.count < 0)) throw new RangeError('Invalid counter input');
    this.#input = value;
  }
  getSnapshot() { return this.input ?? { count: 7 }; }
  dispose() { throw new Error('Host binding must never dispose the renderer'); }
  request() { this.dispatchEvent(new CustomEvent('count-request', { detail: this.input?.count })); }
}
customElements.define('host-binding-probe', Probe);
const { mountHost, verifyAdapterContracts } = await import(`./${process.argv[2]}.mjs`);
const { createCounterHandle } = await import('./compiled/shared/counter-contract.js');
const container = document.createElement('div'); document.body.append(container);
const config = { properties: ['input'], events: { changed: 'count-request' } };
const first = [];
const second = [];
const firstHandler = event => first.push(event.detail);
const secondHandler = { handleEvent(event) { second.push(event.detail); assert.equal(this, secondHandler); } };
const host = await mountHost(container, config);
const element = host.element;
let mounted = true;
const handle = createCounterHandle(() => mounted ? element : null);
assert.equal(Object.isFrozen(handle), true);
assert.equal('shadowRoot' in handle, false);
assert.equal(element.input.count, 7);
const input = { count: 2 };
await host.update({ input, changed: firstHandler });
assert.equal(element.input, input);
assert.equal(handle.getSnapshot().count, 2);
assert.throws(() => { element.input = { count: -1 }; }, RangeError);
assert.equal(element.input, input);
assert.equal(element.hasAttribute('input'), false);
handle.request();
assert.deepEqual(first, [2]);
assert.equal(handle.getSnapshot().count, 2, 'requests must not commit input');
await host.update({ input: { count: 3 }, changed: secondHandler });
element.request();
assert.deepEqual(first, [2]);
assert.deepEqual(second, [3]);
await host.update({});
assert.equal(element.input, undefined);
element.request();
assert.deepEqual(second, [3]);
element.input = { count: 9 };
await host.update({ changed: firstHandler });
assert.equal(element.input.count, 9); // omission released ownership
await host.unmount();
mounted = false;
element.request();
assert.deepEqual(first, [2]);
assert.throws(() => handle.request(), /not mounted/);
assert.equal(container.querySelector('host-binding-probe'), null);
const replacement = await mountHost(container, config);
await replacement.update({ input: { count: 5 }, changed: firstHandler });
assert.notEqual(replacement.element, element);
replacement.element.request();
element.request();
assert.deepEqual(first, [2, 5], 'only the replacement host may deliver requests');
await replacement.unmount();
await verifyAdapterContracts?.();
container.remove();
dom.window.close();
console.log(`${process.argv[2]} actual lifecycle binding contract passed`);
