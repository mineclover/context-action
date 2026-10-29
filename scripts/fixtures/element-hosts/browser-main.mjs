import { hostFactories } from './browser-mounts.mjs';
import { createCounterHandle } from './compiled/shared/counter-contract.js';

const status = document.querySelector('#status');
const run = document.querySelector('#run');
const errors = [];
const sessions = [];
const results = [];
window.elementHostBrowserResults = { status: 'loading' };
window.addEventListener('error', event => errors.push(event.message));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));

function check(condition, message) {
  if (!condition) throw new Error(message);
}

class Probe extends HTMLElement {
  #input = { count: 7 };
  trustedClicks = 0;
  connects = 0;
  disconnects = 0;
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const output = document.createElement('output');
    output.setAttribute('aria-label', 'Confirmed counter value');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Request current value';
    button.addEventListener('click', event => {
      if (event.isTrusted) this.trustedClicks++;
      this.request();
    });
    root.append(output, document.createElement('br'), button);
    this.render();
  }
  connectedCallback() { this.connects++; }
  disconnectedCallback() { this.disconnects++; }
  get input() { return this.#input; }
  set input(value) {
    if (value !== undefined && (!Number.isSafeInteger(value.count) || value.count < 0)) throw new RangeError('Invalid counter input');
    this.#input = value;
    this.render();
  }
  getSnapshot() { return this.input ?? { count: 7 }; }
  render() { this.shadowRoot.querySelector('output').textContent = `Confirmed value: ${this.getSnapshot().count}`; }
  request() { this.dispatchEvent(new CustomEvent('count-request', { detail: this.input?.count, bubbles: true, composed: true })); }
  dispose() { throw new Error('The host binding must not dispose its renderer'); }
}
customElements.define('host-binding-probe', Probe);

function observe(session) {
  document.querySelector(`#${session.name}-observation`).textContent = session.mounted
    ? `Confirmed: ${session.element.getSnapshot().count}; requests: ${session.events.length}; trusted clicks: ${session.element.trustedClicks}`
    : `Unmounted; requests: ${session.events.length}`;
}

async function attach(session) {
  session.host = await hostFactories[session.name](session.container);
  session.element = session.host.element;
  check(session.element instanceof Probe, `${session.name}: native probe did not mount`);
  check(session.element.input.count === 7, `${session.name}: untouched default was overwritten`);
  session.mounted = true;
  const element = session.element;
  session.handle = createCounterHandle(() => session.mounted && session.element === element ? element : null);
  element.shadowRoot.querySelector('button').setAttribute('aria-label', `Request ${session.name} counter`);
}

async function detach(session) {
  await session.host.unmount();
  session.mounted = false;
  observe(session);
}

function record(session, handler, event) {
  session.events.push({ handler, detail: event.detail, bubbles: event.bubbles, composed: event.composed });
  observe(session);
}

async function verifySession(session) {
  const { name, element, handle } = session;
  const checks = ['untouched-default'];
  check(element.isConnected && element.connects === 1, `${name}: host connection lifecycle is invalid`);
  check(element.input === session.input && !element.hasAttribute('input') && !element.hasAttribute('changed'), `${name}: property transport lost identity or became an attribute`);
  check(Object.isFrozen(handle) && !(handle instanceof HTMLElement) && !('shadowRoot' in handle), `${name}: semantic handle leaked DOM`);
  checks.push('property-identity', 'semantic-handle');
  check(element.trustedClicks === 1 && session.events.length === 1 && session.events[0].detail === 2, `${name}: one trusted Shadow DOM click must produce exactly one request`);
  check(handle.getSnapshot().count === 2, `${name}: request incorrectly committed state`);
  checks.push('trusted-shadow-click', 'request-not-commit');

  let rejected = false;
  try { element.input = { count: -1 }; } catch (error) { rejected = error instanceof RangeError; }
  check(rejected && element.input === session.input, `${name}: invalid input replaced valid state`);
  checks.push('invalid-input-preserves-state');
  handle.request();
  check(session.events.length === 2 && session.events.at(-1).bubbles && session.events.at(-1).composed, `${name}: imperative request event contract failed`);
  checks.push('imperative-event');

  let added = 0;
  let removed = 0;
  const add = element.addEventListener;
  const remove = element.removeEventListener;
  element.addEventListener = function (type, ...args) { if (type === 'count-request') added++; return add.call(this, type, ...args); };
  element.removeEventListener = function (type, ...args) { if (type === 'count-request') removed++; return remove.call(this, type, ...args); };
  try {
    await session.host.update({ input: session.input, changed: session.first });
    check(added === 0 && removed === 0 && session.events.length === 2, `${name}: stable handler churn or programmatic input echo`);
    checks.push('stable-listener', 'no-input-echo');
    let receiverPreserved = false;
    const second = { handleEvent(event) { receiverPreserved = this === second; record(session, 'second', event); } };
    await session.host.update({ input: { count: 3 }, changed: second });
    check(added === 1 && removed === 1, `${name}: handler replacement did not reconcile once`);
    handle.request();
    check(receiverPreserved && session.events.length === 3 && session.events.at(-1).handler === 'second' && session.events.at(-1).detail === 3, `${name}: replacement handler or object receiver is stale`);
    checks.push('handler-replacement', 'object-receiver');
    await session.host.update({});
    check(element.input === undefined, `${name}: omitted input was not released`);
    element.request();
    check(session.events.length === 3, `${name}: omitted handler is still active`);
    element.input = { count: 9 };
    await session.host.update({ changed: session.first });
    check(element.input.count === 9, `${name}: omission cleared another owner's later write`);
    checks.push('omission', 'ownership-release');
  } finally {
    element.addEventListener = add;
    element.removeEventListener = remove;
  }

  await detach(session);
  check(!element.isConnected && element.disconnects === 1 && !session.container.querySelector('host-binding-probe'), `${name}: unmount did not disconnect the native element`);
  element.request();
  check(session.events.length === 3, `${name}: detached element retained its listener`);
  let detached = false;
  try { handle.request(); } catch (error) { detached = /not mounted/.test(error.message); }
  check(detached, `${name}: detached facade remained accessible`);
  checks.push('unmount-cleanup', 'detached-handle');

  await attach(session);
  check(session.element !== element, `${name}: remount reused the retired target`);
  await session.host.update({ input: { count: 5 }, changed: session.first });
  session.handle.request();
  element.request();
  check(session.events.length === 4 && session.events.at(-1).detail === 5, `${name}: remount retained old subscriptions or lost new ones`);
  await detach(session);
  session.element.request();
  check(session.events.length === 4, `${name}: final cleanup leaked a listener`);
  checks.push('remount-isolation', 'final-cleanup');
  return { framework: name, passed: true, trustedClicks: element.trustedClicks, checks };
}

function fail(error) {
  window.elementHostBrowserResults = { status: 'failed', error: error.message, results, errors };
  status.textContent = `Failed: ${error.message}`;
  run.disabled = true;
  console.error(error);
}

run.addEventListener('click', async () => {
  run.disabled = true;
  window.elementHostBrowserResults = { status: 'running' };
  status.textContent = 'Running native browser lifecycle contracts';
  try {
    for (const session of sessions) {
      const result = await verifySession(session);
      results.push(result);
      const row = document.createElement('li');
      row.textContent = `${session.name}: PASS (${result.checks.length} checks; trusted Shadow DOM click verified)`;
      document.querySelector('#results').append(row);
    }
    check(errors.length === 0, `Unhandled browser errors: ${errors.join('; ')}`);
    window.elementHostBrowserResults = {
      status: 'passed', results, errors, userAgent: navigator.userAgent,
      versions: { vue: '3.5.44', svelte: '5.57.2', angular: '20.3.34' },
      scope: 'native Shadow DOM probe; client mount/update/unmount; no hydration, FACE, or renderer cross-product claim',
    };
    status.textContent = 'All three framework hosts passed';
  } catch (error) { fail(error); }
});

try {
  for (const name of ['vue', 'svelte', 'angular']) {
    const session = { name, container: document.querySelector(`#${name}-host`), events: [], mounted: false };
    session.first = event => record(session, 'first', event);
    await attach(session);
    session.input = Object.freeze({ count: 2 });
    await session.host.update({ input: session.input, changed: session.first });
    check(session.events.length === 0, `${name}: initial input echoed a request`);
    sessions.push(session);
    observe(session);
  }
  window.elementHostBrowserResults = { status: 'ready' };
  status.textContent = 'Ready: click all three native request buttons, then run contracts';
  run.disabled = false;
} catch (error) { fail(error); }
