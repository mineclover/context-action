// Executed by ego-browser nodejs; settings are injected explicitly, not through shell env.
const settings = '__ELEMENT_HOST_BROWSER_SETTINGS__';
const task = await taskSpace('Context-Action Element host browser contracts');
const page = task.page('p1');
console.log(JSON.stringify({ spaceId: task.spaceId, page: page.label }));
await page.goto(settings.url);
await page.waitForFunction(() => ['ready', 'failed'].includes(window.elementHostBrowserResults?.status), undefined, { timeout: 60_000 });
const ready = await page.evaluate(() => window.elementHostBrowserResults);
if (ready.status !== 'ready') throw new Error(JSON.stringify(ready));
console.log(await page.snapshot());
for (const name of ['vue', 'svelte', 'angular']) {
  await page.click(`loc=role:button[name='Request ${name} counter']`, { label: `request ${name} native counter` });
}
await page.click("loc=role:button[name='Run lifecycle contracts']", { label: 'verify framework lifecycle contracts' });
await page.waitForFunction(() => ['passed', 'failed'].includes(window.elementHostBrowserResults?.status), undefined, { timeout: 60_000 });
const result = await page.evaluate(() => window.elementHostBrowserResults);
if (result.status !== 'passed' || result.results?.length !== 3 || result.results.some(item => !item.passed || item.trustedClicks !== 1)) {
  throw new Error(JSON.stringify(result));
}
console.log(`ELEMENT_HOST_BROWSER_RESULT ${JSON.stringify(result)}`);
console.log(await page.snapshot());
await task.finish({ keep: [] });
