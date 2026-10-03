import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listScenes, resolveScene, startServer } from '../src/server.js';

describe('scene discovery', () => {
  const scenes = listScenes();

  it('lists scenes as field/sub/name with an index.html, skipping _template', () => {
    assert.ok(scenes.length > 0);
    for (const s of scenes) {
      assert.equal(s.id, `${s.field}/${s.sub}/${s.name}`);
      assert.ok(fs.existsSync(path.join(s.dir, 'index.html')), s.id);
      assert.ok(!s.id.split('/').some((p) => p.startsWith('_')), s.id);
    }
  });

  it('resolves the full id and any unique tail of it', () => {
    const s = scenes[0];
    assert.equal(resolveScene(s.id).id, s.id);
    assert.equal(resolveScene(`${s.sub}/${s.name}`).dir, s.dir);
    const unique = scenes.find((x) => scenes.filter((y) => y.name === x.name).length === 1);
    assert.equal(resolveScene(unique.name).id, unique.id);
  });

  it('rejects unknown ids and lists what is available', () => {
    assert.throws(() => resolveScene('definitely/not/a-scene'), /not found[\s\S]*Available/);
  });

  it('rejects ambiguous tails and does not match partial folder names', () => {
    const byName = Object.groupBy(scenes, (s) => s.name);
    const dup = Object.values(byName).find((g) => g.length > 1);
    if (dup) assert.throws(() => resolveScene(dup[0].name), /ambiguous/);
    assert.throws(() => resolveScene(scenes[0].name.slice(1)), /not found/);
  });
});

describe('static server', () => {
  let root, server;
  before(async () => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'vc-server-')));
    fs.mkdirSync(path.join(root, 'sub'));
    fs.writeFileSync(path.join(root, 'sub', 'index.html'), '<h1>sub</h1>');
    fs.writeFileSync(path.join(root, 'a.json'), '{"a":1}');
    fs.writeFileSync(path.join(root, 'data.bin'), '0123456789');
    fs.writeFileSync(path.join(root, 'v.mp4'), '0123456789');
    fs.writeFileSync(path.join(root, 'sp ace.txt'), 'hi');
    server = await startServer(0, root);
  });
  after(async () => {
    await server.close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const get = (p, headers) => fetch(server.url + p, { headers });

  it('serves files with the right content type and no caching', async () => {
    const r = await get('/a.json');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'application/json');
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await r.json(), { a: 1 });
    assert.equal((await get('/data.bin')).headers.get('content-type'), 'application/octet-stream');
    assert.equal((await get('/v.mp4')).headers.get('content-type'), 'video/mp4');
  });

  it('serves a directory index and decoded paths', async () => {
    assert.equal(await (await get('/sub/')).text(), '<h1>sub</h1>');
    assert.equal(await (await get('/sp%20ace.txt')).text(), 'hi');
  });

  it('404s for missing files and directories without an index', async () => {
    assert.equal((await get('/nope.txt')).status, 404);
    assert.equal((await get('/sub')).status, 404);
  });

  it('refuses to leave the root', async () => {
    const r = await get('/..%2F..%2Fetc/passwd');
    assert.ok([403, 404].includes(r.status));
    assert.notEqual(r.status, 200);
  });

  it('supports byte ranges for video seeking', async () => {
    let r = await get('/v.mp4', { range: 'bytes=2-4' });
    assert.equal(r.status, 206);
    assert.equal(r.headers.get('content-range'), 'bytes 2-4/10');
    assert.equal(await r.text(), '234');
    r = await get('/v.mp4', { range: 'bytes=7-' });
    assert.equal(await r.text(), '789');
    r = await get('/v.mp4', { range: 'bytes=-3' });
    assert.equal(await r.text(), '789');
    r = await get('/v.mp4', { range: 'bytes=20-30' });
    assert.equal(r.status, 416);
  });
});
