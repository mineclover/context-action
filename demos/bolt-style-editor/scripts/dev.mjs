import { spawn } from 'node:child_process';
import process from 'node:process';

const forwardedArgs = process.argv.slice(2);
const viteArgs = forwardedArgs[0] === '--' ? forwardedArgs.slice(1) : forwardedArgs;
const viteCommand = process.platform === 'win32' ? 'vite.cmd' : 'vite';
const viteProcess = spawn(viteCommand, viteArgs, {
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
