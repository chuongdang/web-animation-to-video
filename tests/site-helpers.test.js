import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

// the build config reads SITE_URL once at import, and the site dir must never be the real one
process.env.SITE_DIR = path.join(os.tmpdir(), 'video-creator-helpers-test');
const cfg = await import('../src/site/config.js');
const model = await import('../src/site/model.js');

describe('site/config helpers', () => {
  it('titleCase turns slugs into titles', () => {
    assert.equal(cfg.titleCase('how-ai-works'), 'How Ai Works');
    assert.equal(cfg.titleCase('physics'), 'Physics');
  });

  it('esc escapes HTML special characters and coerces to string', () => {
    assert.equal(cfg.esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    assert.equal(cfg.esc(5), '5');
  });

  it('fmt formats seconds as m:ss', () => {
    assert.equal(cfg.fmt(0), '0:00');
    assert.equal(cfg.fmt(65), '1:05');
    assert.equal(cfg.fmt(600), '10:00');
  });

  it('clip leaves short text, and cuts long text at a word boundary with an ellipsis', () => {
    assert.equal(cfg.clip('short', 10), 'short');
    const out = cfg.clip('the quick brown fox jumps', 12);
    assert.ok(out.endsWith('…') && out.length <= 12, out);
    assert.ok(!out.slice(0, -1).endsWith(' '));
    assert.equal(cfg.clip('the quick brown fox jumps', 12), 'the quick…');
  });

  const abs = async (siteUrl) => {
    const { spawnSync } = await import('node:child_process');
    const code = "const c = await import('./src/site/config.js'); console.log(c.abs('/x/') + '|' + c.abs('y'));";
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
      cwd: path.resolve(import.meta.dirname, '..'),
      env: { ...process.env, SITE_DIR: cfg.SITE, SITE_URL: siteUrl }, // an empty value also stops .env from supplying one
      encoding: 'utf8',
    });
    return r.stdout.trim();
  };

  it('abs is empty without SITE_URL (canonical/og/sitemap omitted)', async () => {
    assert.equal(await abs(''), '|');
  });

  it('abs joins SITE_URL (trailing slash stripped) with the path', async () => {
    assert.equal(await abs('https://example.test/'), 'https://example.test/x/|https://example.test/y');
  });

  it('refuses a site dir that contains the project', async () => {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./src/site/config.js')"], {
      cwd: path.resolve(import.meta.dirname, '..'),
      env: { ...process.env, SITE_DIR: path.resolve(import.meta.dirname, '..') },
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /refusing to use/);
  });
});

describe('site/model URLs and lookups', () => {
  const site = {
    fields: {
      b: { id: 'b', order: 2, text: { en: { title: 'B' } } },
      a: { id: 'a', order: 1, text: { en: { title: 'A' }, vi: { title: 'Á' } } },
    },
    videos: [
      { field: 'a', sub: 's1', langs: { en: { poster: 'posters/1.jpg' }, vi: { poster: 'posters/1.vi.jpg' } } },
      { field: 'a', sub: 's2', langs: { en: { poster: 'posters/2.jpg' } } },
      { field: 'b', sub: 's3', langs: { en: { poster: 'posters/3.jpg' } } },
    ],
  };

  it('English URLs have no prefix, other languages get /<lang>', () => {
    assert.equal(model.homePath('en'), '/');
    assert.equal(model.homePath('vi'), '/vi/');
    assert.equal(model.fieldPath('en', 'a'), '/a/');
    assert.equal(model.subPath('vi', 'a', 's1'), '/vi/a/s1/');
    assert.equal(model.watchPath('vi', 'a/s1/x'), '/vi/a/s1/x/');
  });

  it('inLang keeps only videos rendered in that language', () => {
    assert.equal(model.inLang(site, 'en').length, 3);
    assert.equal(model.inLang(site, 'vi').length, 1);
  });

  it('fieldText falls back to English', () => {
    assert.equal(model.fieldText(site.fields.a, 'vi').title, 'Á');
    assert.equal(model.fieldText(site.fields.b, 'vi').title, 'B');
  });

  it('fieldIds follows field order', () => {
    assert.deepEqual(model.fieldIds(site), ['a', 'b']);
  });

  it('sub pages exist only for subjects with 2+ sub-categories in that language', () => {
    assert.deepEqual(model.subsOf(site, 'en', 'a'), ['s1', 's2']);
    assert.equal(model.hasSubPages(site, 'en', 'a'), true);
    assert.equal(model.hasSubPages(site, 'vi', 'a'), false);
    assert.equal(model.hasSubPages(site, 'en', 'b'), false);
  });

  it('poster resolves to the language-specific absolute path', () => {
    assert.equal(model.poster(site.videos[0], 'vi'), '/posters/1.vi.jpg');
  });
});
