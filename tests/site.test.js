// Checks on the generated HTML: what crawlers and no-JS visitors get.
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_DIR, ORIGIN, SKIP, read, pages, siteData } from './helpers.js';

const attr = (html, re) => re.exec(html)?.[1];
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

describe('built site', { skip: SKIP }, () => {
  const list = SKIP ? [] : pages().map((p) => ({ ...p, html: read(p.file) }));
  const data = SKIP ? null : siteData();

  it('has a page for the home, every subject, every video, in every language', () => {
    const paths = new Set(list.map((p) => p.path));
    assert.ok(paths.has('/'));
    for (const l of data.languages.filter((x) => x.code !== 'en')) assert.ok(paths.has(`/${l.code}/`), `/${l.code}/`);
    for (const v of data.videos) for (const code of Object.keys(v.langs)) {
      assert.ok(paths.has(`${code === 'en' ? '' : `/${code}`}/${v.id}/`), `video ${v.id} (${code})`);
    }
    assert.equal(data.pages['/'].h1.length > 0, true);
  });

  it('every page has a unique title, a description, one h1 and a self-referencing canonical', () => {
    const titles = new Map();
    for (const p of list) {
      const title = attr(p.html, /<title>([^<]+)<\/title>/);
      assert.ok(title, `${p.path} title`);
      assert.ok(!titles.has(title), `${p.path} and ${titles.get(title)} share the title "${title}"`);
      titles.set(title, p.path);
      assert.ok(attr(p.html, /<meta name="description" content="([^"]+)"/), `${p.path} description`);
      assert.equal((p.html.match(/<h1\b/g) ?? []).length, 1, `${p.path} h1 count`);
      assert.equal(attr(p.html, /<link rel="canonical" href="([^"]+)"/), ORIGIN + p.path, `${p.path} canonical`);
      assert.equal(attr(p.html, /<html lang="([^"]+)"/), p.path.startsWith('/vi/') ? 'vi' : 'en', `${p.path} lang`);
    }
  });

  it('JSON-LD parses, and watch pages describe a VideoObject with a transcript', () => {
    for (const p of list) {
      const blocks = all(p.html, /<script type="application\/ld\+json">([^]*?)<\/script>/g).map((b) => JSON.parse(b));
      assert.ok(blocks.length, `${p.path} has JSON-LD`);
      assert.ok(blocks.every((b) => b['@context'] === 'https://schema.org' && b['@type']), `${p.path} context/type`);
      const isWatch = data.videos.some((v) => p.path.endsWith(`/${v.id}/`));
      const video = blocks.find((b) => b['@type'] === 'VideoObject');
      assert.equal(Boolean(video), isWatch, `${p.path} VideoObject`);
      if (video) {
        assert.match(video.duration, /^PT\d+M\d+S$/);
        assert.ok(video.transcript.length > 50, `${p.path} transcript`);
        assert.ok(video.contentUrl.startsWith(ORIGIN) && video.thumbnailUrl[0].startsWith(ORIGIN));
        assert.ok(p.html.includes('<video controls') && p.html.includes('<h3>'), `${p.path} shows the video and transcript in the HTML`);
      }
    }
  });

  it('every internal link and asset points at a file that exists', () => {
    for (const p of list) {
      for (const ref of all(p.html, /(?:href|src|poster)="(\/[^"]*)"/g)) {
        const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
        const file = path.join(SITE_DIR, clean.endsWith('/') ? `${clean}index.html` : clean);
        assert.ok(fs.existsSync(file), `${p.path} links to ${ref}`);
      }
    }
  });

  it('has no references to the old /v/ URLs', () => {
    for (const f of ['sitemap.xml', 'llms.txt', 'llms-full.txt', 'data.js', ...list.map((p) => p.file)]) assert.ok(!/\/v\/[\w-]+\//.test(read(f)), f);
  });

  it('sitemap lists exactly the pages, with reciprocal hreflang alternates', () => {
    const xml = read('sitemap.xml');
    const blocks = xml.split('<url>').slice(1);
    const locs = blocks.map((b) => attr(b, /<loc>([^<]+)<\/loc>/));
    assert.deepEqual([...locs].sort(), list.map((p) => ORIGIN + p.path).sort());
    const alts = new Map(blocks.map((b, i) => [locs[i], all(b, /hreflang="[^"]+" href="([^"]+)"/g)]));
    for (const [loc, hrefs] of alts) {
      for (const h of hrefs) assert.ok(alts.get(h)?.includes(loc) || h === loc, `${h} does not link back to ${loc}`);
    }
    assert.equal(blocks.filter((b) => b.includes('<video:video>')).length, data.videos.reduce((n, v) => n + Object.keys(v.langs).length, 0));
  });

  it('robots.txt points at the sitemap; llms files list every video', () => {
    assert.match(read('robots.txt'), new RegExp(`Sitemap: ${ORIGIN}/sitemap.xml`));
    const index = read('llms.txt'), full = read('llms-full.txt');
    for (const v of data.videos) for (const [code, t] of Object.entries(v.langs)) {
      const url = `${ORIGIN}${code === 'en' ? '' : `/${code}`}/${v.id}/`;
      assert.ok(index.includes(url), `llms.txt ${url}`);
      assert.ok(full.includes(`URL: ${url}`), `llms-full.txt ${url}`);
      if (t.transcript.length) assert.ok(full.includes(t.transcript[0]), `llms-full.txt transcript of ${v.id}`);
    }
  });
});
