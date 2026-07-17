import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';

const forwardedArgs = process.argv.slice(2);
const viteArgs = forwardedArgs[0] === '--' ? forwardedArgs.slice(1) : forwardedArgs;
const hasPortArgument = viteArgs.some(
  (argument) => argument === '--port' || argument.startsWith('--port=')
);
const configuredPort = Number.parseInt(process.env.WEB_CODING_PORT ?? '', 10);

async function reservePort() {
  while (true) {
    const port = await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const candidate =
          typeof address === 'object' && address ? address.port : 0;
        server.close((error) => (error ? reject(error) : resolve(candidate)));
      });
    });
    if (port !== 4173 && port !== 5173) return port;
  }
}

const shouldReservePort =
  !hasPortArgument &&
  (!Number.isInteger(configuredPort) || configuredPort <= 0);
const resolvedViteArgs = shouldReservePort
  ? [...viteArgs, '--port', String(await reservePort())]
  : viteArgs;
const viteCommand = process.platform === 'win32' ? 'vite.cmd' : 'vite';
const viteProcess = spawn(viteCommand, resolvedViteArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

viteProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});

viteProcess.on('error', (error) => {
  console.error(`Could not start Vite: ${error.message}`);
  process.exitCode = 1;
});
