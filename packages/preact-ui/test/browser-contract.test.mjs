import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const playwrightPath = require.resolve('playwright', {
  paths: [path.resolve(root, '../style-testing')],
});
const { chromium } = require(playwrightPath);

function resolveCachedChromium() {
  const defaultExecutable = chromium.executablePath();
  if (existsSync(defaultExecutable)) return defaultExecutable;
  const cacheRoots = [
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
    path.join(os.homedir(), '.cache', 'ms-playwright'),
  ];
  const candidates = [];
  for (const cacheRoot of cacheRoots) {
    if (!existsSync(cacheRoot)) continue;
    for (const entry of readdirSync(cacheRoot)) {
      if (!entry.startsWith('chromium_headless_shell-')) continue;
      const executable = path.join(cacheRoot, entry, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
      if (existsSync(executable)) candidates.push(executable);
      const linuxExecutable = path.join(cacheRoot, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
      if (existsSync(linuxExecutable)) candidates.push(linuxExecutable);
    }
  }
  return candidates.sort().at(-1);
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  return port;
}

const port = await freePort();
const server = spawn('pnpm', ['exec', 'vite', '--config', 'examples/vite.config.ts', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
const executablePath = resolveCachedChromium();
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const url = `http://127.0.0.1:${port}/layer-panel-browser.html`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#status[data-ready="true"]').waitFor({ state: 'attached' });

  const initial = await page.locator('pre-layer-panel').evaluate(element => ({
    selected: element.selectedId,
    count: element.shadowRoot?.querySelectorAll('button').length,
    pressed: element.shadowRoot?.querySelector('button[aria-pressed="true"]')?.textContent,
  }));
  assert.deepEqual(initial, { selected: 'one', count: 2, pressed: 'One' });
  assert.equal(await page.locator('pre-layer-panel [data-slot-label]').textContent(), 'External suffix');
  assert.equal(await page.locator('pre-layer-panel').getByRole('button', { name: 'Two' }).count(), 1);
  const layerPanelA11y = await page.locator('pre-layer-panel').ariaSnapshot();
  assert.match(layerPanelA11y, /list/);
  assert.match(layerPanelA11y, /button "One"/);
  assert.match(layerPanelA11y, /button "Two"/);

  await page.locator('pre-layer-panel').locator('button').nth(1).click();
  assert.equal(await page.evaluate(() => window.layerPanelContract.requestIds.join(',')), 'two');
  assert.equal(await page.locator('pre-layer-panel').evaluate(element => element.selectedId), 'one');

  await page.locator('pre-layer-panel').evaluate(element => { element.selectedId = 'two'; });
  assert.equal(await page.evaluate(() => window.layerPanelContract.requestIds.join(',')), 'two');
  await page.evaluate(() => window.layerPanelContract.reconnect());
  assert.equal(await page.locator('pre-layer-panel').evaluate(element => element.selectedId), 'two');
  assert.equal(await page.locator('pre-layer-panel').evaluate(element => element.focusItem('two')), true);
  assert.equal(await page.locator('pre-layer-panel [data-slot-label]').textContent(), 'External suffix');
  await page.locator('pre-layer-panel').evaluate(element => { element.selectedId = 'one'; });
  await page.locator('pre-layer-panel').getByRole('button', { name: 'Two' }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.layerPanelContract.requestIds.join(',')), 'two,two');

  await page.locator('#template-host button').nth(1).click();
  assert.equal(await page.evaluate(() => window.layerPanelContract.templateRequestIds.join(',')), 'two');
  assert.equal(await page.locator('#template-host button[aria-pressed="true"]').textContent(), 'One');

  const replacementSlot = await page.locator('pre-layer-panel').evaluate(async element => {
    const slot = element.shadowRoot?.querySelector('slot[name="suffix"]');
    const existing = element.querySelector('[data-slot-label]');
    if (!(slot instanceof HTMLSlotElement) || !existing) throw new Error('suffix slot fixture is incomplete');

    const slotChanged = new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 1000);
      slot.addEventListener('slotchange', () => {
        clearTimeout(timeout);
        resolve(true);
      }, { once: true });
    });
    const replacement = document.createElement('span');
    replacement.slot = 'suffix';
    replacement.dataset.slotLabel = 'Replacement suffix';
    replacement.textContent = 'Replacement suffix';
    existing.replaceWith(replacement);
    const changed = await slotChanged;
    const assigned = slot.assignedNodes({ flatten: true });
    return {
      changed,
      assignedCount: assigned.length,
      assignedLabel: assigned[0]?.dataset?.slotLabel,
      preservesNodeIdentity: assigned[0] === replacement,
    };
  });
  assert.deepEqual(replacementSlot, {
    changed: true,
    assignedCount: 1,
    assignedLabel: 'Replacement suffix',
    preservesNodeIdentity: true,
  });

  const fallbackSlot = await page.locator('pre-layer-panel').evaluate(async element => {
    const slot = element.shadowRoot?.querySelector('slot[name="suffix"]');
    const replacement = element.querySelector('[data-slot-label]');
    if (!(slot instanceof HTMLSlotElement) || !replacement) throw new Error('replacement slot fixture is incomplete');

    const slotChanged = new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 1000);
      slot.addEventListener('slotchange', () => {
        clearTimeout(timeout);
        resolve(true);
      }, { once: true });
    });
    replacement.remove();
    const changed = await slotChanged;
    const assigned = slot.assignedNodes({ flatten: true });
    return {
      changed,
      assignedHostCount: assigned.filter(node => node.parentNode !== slot).length,
      fallbackText: slot.querySelector('[data-slot-fallback]')?.textContent,
    };
  });
  assert.deepEqual(fallbackSlot, {
    changed: true,
    assignedHostCount: 0,
    fallbackText: 'No additional content',
  });

  await page.goto(`${new URL(url).origin}/vanilla-embed.html`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#wc-change-name').count(), 1);
  const orderWorkspace = page.locator('order-workspace');
  await orderWorkspace.waitFor({ state: 'attached' });
  await orderWorkspace.evaluate(element => {
    element.dataset.changeEvents = '0';
    element.addEventListener('order-change', () => {
      element.dataset.changeEvents = String(Number(element.dataset.changeEvents ?? '0') + 1);
    });
  });
  await page.locator('#wc-change-name').click();
  await page.waitForTimeout(50);
  const customerName = await orderWorkspace.evaluate(element => ({
    property: element.customerName,
    attribute: element.getAttribute('customer-name'),
    input: element.shadowRoot?.querySelector('[data-testid="input-customer-name"]')?.value,
  }));
  assert.deepEqual(customerName, {
    property: '이순신 (조선 수군)',
    attribute: '이순신 (조선 수군)',
    input: '이순신 (조선 수군)',
  });
  assert.equal(await orderWorkspace.getAttribute('data-change-events'), '0');

  // The projected order view exposes its form and live updates through the
  // browser accessibility tree. Keep these checks in the real Chromium
  // contract so the Shadow DOM boundary and Preact renderer are exercised
  // together rather than only through jsdom snapshots.
  const formLabels = await orderWorkspace.evaluate(element => {
    const root = element.shadowRoot;
    const nameInput = root?.querySelector('[data-testid="input-new-item-name"]');
    const priceInput = root?.querySelector('[data-testid="input-new-item-price"]');
    if (!(nameInput instanceof HTMLInputElement) || !(priceInput instanceof HTMLInputElement)) {
      throw new Error('projected order item inputs are missing');
    }
    const nameLabel = root?.querySelector(`label[for="${nameInput.id}"]`);
    const priceLabel = root?.querySelector(`label[for="${priceInput.id}"]`);
    return {
      name: { id: nameInput.id, label: nameLabel?.textContent?.trim() },
      price: { id: priceInput.id, label: priceLabel?.textContent?.trim() },
    };
  });
  assert.equal(formLabels.name.id.length > 0, true);
  assert.equal(formLabels.name.label, 'Item name');
  assert.equal(formLabels.price.id.length > 0, true);
  assert.equal(formLabels.price.label, 'Price');

  // A submit with no items surfaces a domain validation error and associates
  // it with the labelled list for screen-reader users.
  await orderWorkspace.evaluate(async element => {
    await element.submit();
  });
  const itemsError = orderWorkspace.locator('[data-testid="error-items"]');
  await itemsError.waitFor({ state: 'attached' });
  const itemsA11y = await orderWorkspace.evaluate(element => {
    const root = element.shadowRoot;
    const error = root?.querySelector('[data-testid="error-items"]');
    const list = root?.querySelector('ul[aria-labelledby]');
    return {
      role: error?.getAttribute('role'),
      errorId: error?.id,
      describedBy: list?.getAttribute('aria-describedby'),
    };
  });
  assert.equal(itemsA11y.role, 'alert');
  assert.equal(itemsA11y.errorId, itemsA11y.describedBy);

  await page.locator('#wc-add-item').click();
  const quantity = orderWorkspace.locator('[data-testid^="item-qty-"]');
  await quantity.waitFor({ state: 'attached' });
  const quantityA11y = await quantity.evaluate(element => ({
    role: element.getAttribute('role'),
    live: element.getAttribute('aria-live'),
    atomic: element.getAttribute('aria-atomic'),
    label: element.getAttribute('aria-label'),
    value: element.textContent?.trim(),
  }));
  assert.deepEqual(quantityA11y, {
    role: 'status',
    live: 'polite',
    atomic: 'true',
    label: 'Quantity for 거북선 피규어',
    value: '1',
  });
  await orderWorkspace.getByRole('button', { name: 'Increase quantity for 거북선 피규어' }).click();
  await quantity.getByText('2').waitFor({ state: 'attached' });
  assert.equal(await quantity.textContent(), '2');

  const activityToggle = orderWorkspace.locator('button[aria-controls]').first();
  const activityLogId = await activityToggle.getAttribute('aria-controls');
  assert.equal(await activityToggle.getAttribute('aria-expanded'), 'false');
  assert.ok(activityLogId);
  await activityToggle.click();
  assert.equal(await activityToggle.getAttribute('aria-expanded'), 'true');
  const activityLog = orderWorkspace.locator(`#${activityLogId}`);
  await activityLog.waitFor({ state: 'attached' });
  assert.equal(await activityLog.getAttribute('aria-label'), 'Activity log entries');
  await activityToggle.click();
  assert.equal(await activityToggle.getAttribute('aria-expanded'), 'false');

  const quantityStepper = page.locator('#order-quantity');
  assert.equal(await page.getByRole('spinbutton', { name: '수량 선택 (FACE 커스텀 엘리먼트):' }).count(), 1);
  assert.equal(await page.locator('label[for="order-quantity"]').count(), 1);
  const quantityAxSession = await page.context().newCDPSession(page);
  const axDocument = await quantityAxSession.send('DOM.getDocument');
  const axQuantityNode = await quantityAxSession.send('DOM.querySelector', {
    nodeId: axDocument.root.nodeId,
    selector: '#order-quantity',
  });
  async function readQuantityAx() {
    const tree = await quantityAxSession.send('Accessibility.getPartialAXTree', {
      nodeId: axQuantityNode.nodeId,
      fetchRelatives: true,
    });
    const node = tree.nodes.find(candidate => candidate.role?.value === 'spinbutton');
    if (!node) throw new Error('quantity spinbutton is missing from Chromium AX tree');
    const property = name => node.properties?.find(candidate => candidate.name === name)?.value?.value;
    return {
      role: node.role?.value,
      name: node.name?.value,
      description: node.description?.value,
      value: node.value?.value,
      invalid: property('invalid'),
    };
  }
  assert.deepEqual(await readQuantityAx(), {
    role: 'spinbutton',
    name: '수량 선택 (FACE 커스텀 엘리먼트):',
    description: '수량을 선택하세요. 위쪽 또는 아래쪽 화살표 키로 변경할 수 있습니다.',
    value: 2,
    invalid: 'false',
  });
  const quantitySemantics = await quantityStepper.evaluate(element => {
    return {
      role: element.getAttribute('role'),
      labelledBy: element.getAttribute('aria-labelledby'),
      tabIndex: element.tabIndex,
      value: element.getAttribute('aria-valuenow'),
      min: element.getAttribute('aria-valuemin'),
      max: element.getAttribute('aria-valuemax'),
      invalid: element.getAttribute('aria-invalid'),
      description: element.getAttribute('aria-description'),
      decreaseName: element.shadowRoot?.querySelector('[data-testid="decrease-quantity"]')?.getAttribute('aria-label'),
      increaseName: element.shadowRoot?.querySelector('[data-testid="increase-quantity"]')?.getAttribute('aria-label'),
    };
  });
  assert.deepEqual(quantitySemantics, {
    role: 'spinbutton',
    labelledBy: 'order-quantity-label',
    tabIndex: 0,
    value: '2',
    min: '1',
    max: '10',
    invalid: 'false',
    description: '수량을 선택하세요. 위쪽 또는 아래쪽 화살표 키로 변경할 수 있습니다.',
    decreaseName: 'Decrease quantity',
    increaseName: 'Increase quantity',
  });
  const quantitySpinbuttonA11y = await quantityStepper.ariaSnapshot();
  assert.match(quantitySpinbuttonA11y, /spinbutton/);
  assert.match(quantitySpinbuttonA11y, /button "Decrease quantity"/);
  assert.match(quantitySpinbuttonA11y, /button "Increase quantity"/);
  assert.match(quantitySpinbuttonA11y, /alert/);

  await quantityStepper.evaluate(element => element.setAttribute('value', '0'));
  await page.waitForTimeout(20);
  const invalidQuantity = await quantityStepper.evaluate(element => {
    return {
      value: element.getAttribute('aria-valuenow'),
      invalid: element.getAttribute('aria-invalid'),
      description: element.getAttribute('aria-description'),
      error: element.shadowRoot?.querySelector('[role="alert"]')?.textContent?.trim(),
    };
  });
  assert.deepEqual(invalidQuantity, {
    value: '0',
    invalid: 'true',
    description: '최소 수량은 1개입니다.',
    error: '최소 수량은 1개입니다.',
  });
  const invalidQuantityA11y = await quantityStepper.ariaSnapshot();
  assert.match(invalidQuantityA11y, /alert/);
  assert.match(invalidQuantityA11y, /최소 수량은 1개입니다\./);
  assert.deepEqual(await readQuantityAx(), {
    role: 'spinbutton',
    name: '수량 선택 (FACE 커스텀 엘리먼트):',
    description: '수량을 선택하세요. 위쪽 또는 아래쪽 화살표 키로 변경할 수 있습니다. 최소 수량은 1개입니다.',
    value: 1,
    invalid: 'true',
  });
  await quantityStepper.evaluate(element => {
    const button = element.shadowRoot?.querySelector('[data-testid="increase-quantity"]');
    if (!(button instanceof HTMLElement)) throw new Error('increase button is missing');
    button.click();
  });
  assert.equal(await quantityStepper.getAttribute('aria-valuenow'), '1');
  assert.equal(await quantityStepper.getAttribute('aria-invalid'), 'false');
  await quantityStepper.focus();
  await page.keyboard.press('ArrowUp');
  assert.equal(await quantityStepper.getAttribute('aria-valuenow'), '2');
  await quantityStepper.evaluate(element => element.setAttribute('value', '2'));
  await page.waitForTimeout(20);

  const checkoutForm = page.locator('#native-checkout-form');
  assert.deepEqual(
    await checkoutForm.evaluate(form => Object.fromEntries(new FormData(form).entries())),
    { productName: 'Preact Signals 아키텍처 가이드북', orderQuantity: '2' },
  );
  await quantityStepper.evaluate(element => {
    const button = element.shadowRoot?.querySelector('[data-testid="increase-quantity"]');
    if (!(button instanceof HTMLElement)) throw new Error('increase button is missing');
    button.click();
  });
  assert.equal(await quantityStepper.getAttribute('aria-valuenow'), '3');
  assert.equal(
    await checkoutForm.evaluate(form => new FormData(form).get('orderQuantity')),
    '3',
  );
  await checkoutForm.evaluate(form => form.reset());
  await page.waitForTimeout(20);
  assert.equal(await quantityStepper.getAttribute('aria-valuenow'), '2');
  assert.equal(
    await checkoutForm.evaluate(form => new FormData(form).get('orderQuantity')),
    '2',
  );
  await quantityStepper.evaluate(element => element.dispose());
  assert.equal(
    await checkoutForm.evaluate(form => new FormData(form).get('orderQuantity')),
    null,
  );
  await quantityAxSession.detach();

  await page.goto(`${new URL(url).origin}/ssr-browser.html`, { waitUntil: 'networkidle' });
  await page.locator('#ssr-status[data-ready="true"]').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#ssr-host').textContent(), 'Client label');
  await page.locator('#ssr-host').getByRole('button', { name: 'Client label' }).click();
  assert.equal(await page.locator('#ssr-status').getAttribute('data-clicks'), '1');
  await page.evaluate(() => window.ssrBrowserContract?.destroy());
  assert.equal(await page.locator('#ssr-status[data-destroyed="true"]').count(), 1);
  assert.equal(await page.locator('#ssr-host').textContent(), '');

  console.log('Layer Panel browser contract passed');
} finally {
  await browser.close();
  if (server.pid) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch {}
  }
}
