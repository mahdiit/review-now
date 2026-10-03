#!/usr/bin/env node
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const names = ['review_now_general', 'review_now_security', 'review_now_frontend'];
const source = fileURLToPath(new URL('../assets/agents/', import.meta.url));

export async function installAgents({ project = process.cwd(), global = false, dryRun = false, codexHome = process.env.CODEX_HOME || path.join(homedir(), '.codex') } = {}) {
  const destination = global ? path.resolve(codexHome, 'agents') : path.resolve(project, '.codex', 'agents');
  // Do not follow a destination symlink or junction to an unexpected directory.
  for (let current = destination; ; current = path.dirname(current)) {
    const stat = await lstat(current).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (stat?.isSymbolicLink()) throw new Error('Refusing symlink destination: ' + current);
    if (stat && !stat.isDirectory()) throw new Error('Not a directory: ' + current);
    if (path.dirname(current) === current) break;
  }
  // Preflight every role before writing any, so a conflict does not partially install the bundle.
  const plan = [];
  for (const name of names) {
    const filename = name + '.toml';
    const content = await readFile(path.join(source, filename), 'utf8');
    const target = path.join(destination, filename);
    const stat = await lstat(target).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw new Error('Refusing non-file destination: ' + target);
    const existing = stat ? await readFile(target, 'utf8') : null;
    if (existing !== null && existing !== content) throw new Error('Existing agent differs; back it up or choose another project: ' + target);
    plan.push({ target, content, action: existing === content ? 'unchanged' : 'install' });
  }
  if (!dryRun) {
    await mkdir(destination, { recursive: true });
    for (const item of plan) {
      if (item.action === 'install') await writeFile(item.target, item.content, { flag: 'wx' });
    }
  }
  return plan.map(({ target, action }) => ({ target, action: dryRun && action === 'install' ? 'would install' : action }));
}

async function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help') {
      console.log('Usage: node install-agents.mjs [--project <directory> | --global] [--dry-run]\nCopies three bundled Codex agents without modifying config.toml or replacing existing agents.');
      return;
    }
    if (args[i] === '--global') options.global = true;
    else if (args[i] === '--dry-run') options.dryRun = true;
    else if (args[i] === '--project' && args[i + 1] && !args[i + 1].startsWith('--')) options.project = args[++i];
    else throw new Error('Unknown or incomplete option: ' + args[i]);
  }
  if (options.global && options.project) throw new Error('Choose either --project or --global.');
  for (const item of await installAgents(options)) console.log(item.action + ': ' + item.target);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
