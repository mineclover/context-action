/** Browser-only phase of the isolated host gate; all automation uses ego-browser. */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/element-hosts');
const expectedChecks = [
  'untouched-default', 'property-identity', 'semantic-handle', 'trusted-shadow-click', 'request-not-commit',
  'invalid-input-preserves-state', 'imperative-event', 'stable-listener', 'no-input-echo',
  'handler-replacement', 'object-receiver', 'omission', 'ownership-release', 'unmount-cleanup',
  'detached-handle', 'remount-isolation', 'final-cleanup',
];

function runDriver(script, env, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('ego-browser', ['nodejs'], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('ego-browser host verification timed out'));
    }, 180_000);
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`ego-browser exited ${code}\n${stdout}\n${stderr}`));
    });
    child.stdin.on('error', () => { /* Early child exits are reported by close/error. */ });
    child.stdin.end(script);
  });
}

/** ego-browser console output may arrive on stderr; neither stream alone is authoritative. */
export function parseElementHostBrowserResult(stdout, stderr) {
  const markers = `${stdout}\n${stderr}`.split('\n').filter(line => line.startsWith('ELEMENT_HOST_BROWSER_RESULT '));
  assert.equal(markers.length, 1, 'ego-browser must return exactly one browser contract result');
  const result = JSON.parse(markers[0].slice('ELEMENT_HOST_BROWSER_RESULT '.length));
  assert.equal(result.status, 'passed');
  assert.ok(typeof result.userAgent === 'string' && result.userAgent.length > 0, 'Browser user-agent evidence is required');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.versions, { vue: '3.5.44', svelte: '5.57.2', angular: '20.3.34' });
  assert.deepEqual(result.results.map(item => item.framework), ['vue', 'svelte', 'angular']);
  for (const item of result.results) {
    assert.equal(item.passed, true);
    assert.equal(item.trustedClicks, 1);
    assert.deepEqual(item.checks, expectedChecks);
  }
  return result;
}

export function createBrowserEvidenceDirectory(directory) {
  const evidence = directory ?? mkdtempSync(join(tmpdir(), 'context-action-element-browser-evidence-'));
  mkdirSync(evidence, { recursive: true });
  assert.equal(readdirSync(evidence).length, 0, `Browser evidence directory must be empty: ${evidence}`);
  return evidence;
}

export async function verifyElementHostBrowser(consumer, env) {
  const evidence = createBrowserEvidenceDirectory(process.env.CONTEXT_ACTION_BROWSER_EVIDENCE_DIR);
  console.log(`Browser evidence: ${evidence}`);
  writeFileSync(join(consumer, 'bundle-browser.mjs'), `
import { build } from 'esbuild';
await build({ entryPoints: ['browser-main.mjs'], outfile: 'browser/app.js', bundle: true, format: 'esm',
  platform: 'browser', target: 'es2022', conditions: ['browser'],
  define: { 'process.env.NODE_ENV': '"development"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' } });
`);
  execFileSync(process.execPath, ['bundle-browser.mjs'], { cwd: consumer, env, stdio: 'inherit' });
  const bundle = readFileSync(join(consumer, 'browser/app.js'));
  const artifactSha256 = createHash('sha256').update(bundle).digest('hex');
  writeFileSync(join(evidence, 'artifact.json'), JSON.stringify({ artifactSha256 }, null, 2));
  const html = readFileSync(join(fixtures, 'browser.html'));
  let authority;
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.headers.host !== authority) { response.writeHead(403); response.end(); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const asset = request.url === '/' ? { type: 'text/html; charset=utf-8', body: html }
      : request.url === '/app.js' ? { type: 'application/javascript; charset=utf-8', body: bundle } : null;
    if (!asset) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', asset.type);
    response.end(request.method === 'HEAD' ? undefined : asset.body);
  });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    authority = `127.0.0.1:${server.address().port}`;
    const url = `http://${authority}/`;
    const script = readFileSync(join(fixtures, 'browser-driver.mjs'), 'utf8')
      .replace("'__ELEMENT_HOST_BROWSER_SETTINGS__'", JSON.stringify({ url }));
    const driver = await runDriver(script, env, consumer);
    writeFileSync(join(evidence, 'browser-driver.log'), `${driver.stdout}\n${driver.stderr}`);
    const result = parseElementHostBrowserResult(driver.stdout, driver.stderr);
    for (const item of result.results) {
      console.log(`${item.framework}: browser PASS (${item.checks.length} checks; trusted Shadow DOM click)`);
    }
    writeFileSync(join(evidence, 'browser-result.json'), JSON.stringify({
      checkedAt: new Date().toISOString(), driver: 'ego-browser',
      artifactSha256, result,
    }, null, 2));
    console.log('Real browser host lifecycle contracts passed; hydration and FACE are not certified.');
  } catch (error) {
    writeFileSync(join(evidence, 'browser-error.log'), String(error.stack ?? error));
    throw error;
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
