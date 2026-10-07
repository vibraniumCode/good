import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];
const jobs = [
  { name: 'api', command: process.execPath, args: ['--watch', 'server/src/index.js'], cwd: root },
  { name: 'web', command: process.execPath, args: [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '0.0.0.0', path.join(root, 'client')], cwd: root }
];

for (const job of jobs) {
  const child = spawn(job.command, job.args, { cwd: job.cwd, stdio: 'inherit', env: process.env });
  child.on('error', (error) => { console.error(`[${job.name}] ${error.message}`); stop(1); });
  child.on('exit', (code) => { if (code && code !== 0) stop(code); });
  children.push(child);
}

function stop(code = 0) {
  for (const child of children) if (!child.killed) child.kill();
  process.exitCode = code;
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
