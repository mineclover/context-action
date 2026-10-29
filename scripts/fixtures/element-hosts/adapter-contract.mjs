import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElementDirective } from './compiled/vue/element-directive.js';
import { createElementAction } from './compiled/svelte/element-action.js';

const dom = new JSDOM('<!doctype html><body></body>');
class Probe extends dom.window.HTMLElement {
  input = 'default';
  set rejected(value) { throw new RangeError(`rejected ${value}`); }
}
dom.window.customElements.define('adapter-lifetime-probe', Probe);
class EventfulProbe extends dom.window.HTMLElement {
  other = 'untouched';
  set input(_value) { this.dispatchEvent(new dom.window.Event('change')); }
}
dom.window.customElements.define('adapter-reentrant-probe', EventfulProbe);
const event = () => new dom.window.Event('change');

for (const kind of ['vue', 'svelte']) {
  const properties = ['input', 'rejected'];
  const events = { changed: 'change' };
  const options = { assignmentErrors: 'throw' };
  const adapter = kind === 'vue' ? createElementDirective({ properties, events }, options)
    : createElementAction({ properties, events }, options);
  properties.length = 0; events.changed = 'mutated'; options.assignmentErrors = 'ignore';
  const first = new Probe(); const second = new Probe();
  let calls = 0;
  const changed = () => calls++;
  const connect = (element, input) => {
    if (kind === 'svelte') return adapter(element, input);
    adapter.mounted(element, { value: input });
    return { update(next) { adapter.updated(element, { value: next }); }, destroy() { adapter.beforeUnmount(element); } };
  };
  const a = connect(first, { input: 'first', changed });
  const b = connect(second, { input: 'second', changed });
  assert.deepEqual([first.input, second.input], ['first', 'second']);
  first.dispatchEvent(event()); second.dispatchEvent(event());
  assert.equal(calls, 2);
  a.destroy(); a.destroy();
  first.dispatchEvent(event()); second.dispatchEvent(event());
  assert.equal(calls, 3);
  assert.throws(() => b.update({ rejected: 1 }), RangeError, 'factory must capture the fail-fast policy');
  b.update({});
  assert.equal(second.input, undefined);
  b.destroy();

  const failing = kind === 'vue' ? createElementDirective({ properties: ['input', 'rejected'], events: { changed: 'change' } })
    : createElementAction({ properties: ['input', 'rejected'], events: { changed: 'change' } });
  const rejected = new Probe();
  assert.throws(() => {
    if (kind === 'svelte') failing(rejected, { input: 'attempted', rejected: 1, changed });
    else failing.mounted(rejected, { value: { input: 'attempted', rejected: 1, changed } });
  }, RangeError);
  rejected.dispatchEvent(event());
  assert.equal(rejected.input, 'attempted', 'initialization cleanup does not roll back setters');
  assert.equal(calls, 3, 'failed initialization must clean event listeners');
}
const eventful = new EventfulProbe();
const directive = createElementDirective({ properties: ['input', 'other'], events: { changed: 'change' } });
let delivered = 0;
directive.mounted(eventful, { value: {
  input: 1, other: 'must not apply', changed() { delivered++; directive.beforeUnmount(eventful); },
} });
assert.equal(eventful.other, 'untouched');
eventful.dispatchEvent(event());
assert.equal(delivered, 1, 'cleanup must be installed before synchronous initialization events');
dom.window.close();
console.log('Reusable adapter isolation, captured config and failed-initialization cleanup passed');
