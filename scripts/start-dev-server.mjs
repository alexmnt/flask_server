import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const pythonCommand = process.env.PLAYWRIGHT_PYTHON ?? 'python';

const startProcess = (command, args, envOverrides = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...envOverrides },
  });

  child.on('error', (error) => {
    console.error(`[dev-server] Failed to start ${command}: ${error.message}`);
  });

  return child;
};

const vite = startProcess(npmCommand, ['run', 'dev']);
const flask = startProcess(pythonCommand, ['app.py'], { VITE_DEV: '1' });

let shuttingDown = false;

const killChildren = () => {
  [vite, flask].forEach((child) => {
    if (!child.killed) {
      try {
        child.kill(isWindows ? undefined : 'SIGTERM');
      } catch {
        // Ignore shutdown errors from already-closed processes.
      }
    }
  });
};

const shutdown = (code) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  killChildren();
  if (typeof code === 'number') {
    process.exit(code);
  }
};

const handleExit = (child, name) => {
  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    const exitCode = typeof code === 'number' ? code : 1;
    const reason = signal ? `signal ${signal}` : `code ${exitCode}`;
    console.error(`[dev-server] ${name} exited with ${reason}.`);
    shutdown(exitCode);
  });
};

handleExit(vite, 'vite');
handleExit(flask, 'flask');

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => {
  killChildren();
});
