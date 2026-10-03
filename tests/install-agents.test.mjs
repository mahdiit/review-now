import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installAgents } from '../skills/review-now/scripts/install-agents.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'review-now-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('project installation is idempotent and preserves existing config', async t => {
  const project = await fixture(t);
  await mkdir(path.join(project, '.codex'));
  const config = path.join(project, '.codex', 'config.toml');
  await writeFile(config, 'model = "existing-model"\n');
  const plan = await installAgents({ project });
  assert.equal(plan.length, 3);
  for (const item of plan) {
    assert.equal(item.action, 'install');
    const content = await readFile(item.target, 'utf8');
    assert.match(content, /sandbox_mode = "read-only"/);
    assert.match(content, /developer_instructions =/);
  }
  assert.equal(await readFile(config, 'utf8'), 'model = "existing-model"\n');
  assert.ok((await installAgents({ project })).every(item => item.action === 'unchanged'));
});

test('dry run creates no destination and global scope honors CODEX_HOME location', async t => {
  const project = await fixture(t);
  const codexHome = path.join(project, 'custom-codex');
  const plan = await installAgents({ global: true, codexHome, dryRun: true });
  assert.ok(plan.every(item => item.action === 'would install' && path.dirname(item.target) === path.join(codexHome, 'agents')));
  assert.deepEqual(await readdir(project), []);
  await installAgents({ global: true, codexHome });
  assert.equal((await readdir(path.join(codexHome, 'agents'))).length, 3);
});

test('a conflicting role aborts before installing other roles', async t => {
  const project = await fixture(t);
  const destination = path.join(project, '.codex', 'agents');
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, 'review_now_frontend.toml'), 'user-owned');
  await assert.rejects(installAgents({ project }), /Existing agent differs/);
  assert.deepEqual(await readdir(destination), ['review_now_frontend.toml']);
  assert.equal(await readFile(path.join(destination, 'review_now_frontend.toml'), 'utf8'), 'user-owned');
});

test('installer rejects symlink or junction destinations', async t => {
  const project = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, path.join(project, '.codex'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(installAgents({ project }), /symlink destination/);
  assert.deepEqual(await readdir(outside), []);
});

test('CLI rejects ambiguous scope and missing arguments without writing', async t => {
  const project = await fixture(t);
  const script = fileURLToPath(new URL('../skills/review-now/scripts/install-agents.mjs', import.meta.url));
  for (const args of [['--project'], ['--global', '--project', project], ['--unknown']]) {
    const result = spawnSync(process.execPath, [script, ...args], { cwd: project, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.length > 0);
  }
  assert.deepEqual(await readdir(project), []);
});
