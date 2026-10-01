// Browser tests of the single-page app on top of the static pages: real URLs, no reloads, same screens.
import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from '../src/server.js';
import { SITE_DIR, SKIP, siteData } from './helpers.js';

const data = SKIP ? null : siteData();
const multiSubField = data?.fields.find((f) => new Set(data.videos.filter((v) => v.field === f.id && v.langs.en).map((v) => v.sub)).size > 1);

describe('single-page app', { skip: SKIP }, () => {
  let server, browser, field, video;
  before(async () => {
    server = await startServer(0, SITE_DIR);
    browser = await chromium.launch();
    video = data.videos.find((v) => v.langs.en);
    field = video.field;
  });
  after(async () => { await browser?.close(); await server?.close(); });

  /** a page that records console / page errors */
  const open = async (url, opts = {}) => {
    const page = await browser.newPage({ locale: 'en-US', ...opts });
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()));
    await page.goto(server.url + url);
    await page.waitForSelector('.card');
    return page;
  };
  const here = (page) => new URL(page.url()).pathname;
  const modalOpen = (page) => page.locator('#modal').isVisible();

  it('switching subjects changes the URL, title and h1 without reloading', async () => {
    const page = await open('/');
    await page.evaluate(() => { window.__same = true; });
    const title = await page.title();
    await page.click(`a.tab[href="/${field}/"]`);
    assert.equal(here(page), `/${field}/`);
    assert.notEqual(await page.title(), title);
    assert.equal(await page.textContent('#page-h1'), data.pages[`/${field}/`].h1);
    assert.equal(await page.evaluate(() => window.__same), true, 'page reloaded');
    assert.equal(await page.locator('.card').count(), data.videos.filter((v) => v.field === field && v.langs.en).length);
    assert.deepEqual(page.errors, []);
    await page.close();
  });

  it('opening a video gives it its own URL; Escape and back/forward move between screens', async () => {
    const page = await open(`/${field}/`);
    await page.click(`a.card[data-id="${video.id}"]`);
    assert.equal(here(page), `/${video.id}/`);
    assert.ok(await modalOpen(page));
    assert.ok((await page.locator('#m-transcript p').count()) > 0, 'transcript shown in the player');
    await page.keyboard.press('Escape');
    assert.equal(here(page), `/${field}/`);
    assert.ok(!(await modalOpen(page)));
    await page.goBack();
    assert.equal(here(page), `/${video.id}/`);
    assert.ok(await modalOpen(page));
    assert.deepEqual(page.errors, []);
    await page.close();
  });

  it('a direct visit to a video URL opens the player', async () => {
    const page = await open(`/${video.id}/`);
    assert.ok(await modalOpen(page));
    assert.equal(await page.textContent('#m-title'), video.langs.en.title);
    assert.deepEqual(page.errors, []);
    await page.close();
  });

  it('sub-category pages filter the list', { skip: !multiSubField && 'no subject with 2+ sub-categories' }, async () => {
    const page = await open(`/${multiSubField.id}/`);
    const subs = await page.locator('a.tab.sub').count();
    assert.ok(subs >= 3, 'All + at least two sub-categories');
    await page.locator('a.tab.sub').nth(1).click();
    assert.match(here(page), new RegExp(`^/${multiSubField.id}/[^/]+/$`));
    const sub = here(page).split('/')[2];
    assert.equal(await page.locator('.card').count(), data.videos.filter((v) => v.field === multiSubField.id && v.sub === sub && v.langs.en).length);
    await page.close();
  });

  it('old #hash and ?lang= links are rewritten to real URLs', async () => {
    let page = await open(`/#${video.id}`);
    assert.equal(here(page), `/${video.id}/`);
    assert.equal(new URL(page.url()).hash, '');
    await page.close();
    page = await open(`/#${field}`);
    assert.equal(here(page), `/${field}/`);
    await page.close();
  });

  it('other languages live under their own prefix', { skip: !data?.languages.some((l) => l.code === 'vi') && 'no vi videos' }, async () => {
    const vi = data.videos.find((v) => v.langs.vi);
    const page = await open(`/vi/${vi.field}/`);
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'vi');
    assert.equal(await page.title(), data.pages[`/vi/${vi.field}/`].title);
    await page.click(`a.card[data-id="${vi.id}"]`);
    assert.equal(here(page), `/vi/${vi.id}/`);
    assert.equal(await page.textContent('#m-title'), vi.langs.vi.title);
    assert.deepEqual(page.errors, []);
    await page.close();
  });

  it('a path without a language prefix is English, whatever the browser language is', { skip: !data?.languages.some((l) => l.code === 'vi') && 'no vi videos' }, async () => {
    const page = await open('/', { locale: 'vi-VN' });
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    assert.equal(here(page), '/');
    await page.goto(`${server.url}/vi/`);
    await page.waitForSelector('.card');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'vi');
    await page.click('.brand'); // logo goes home in the current language
    assert.equal(here(page), '/vi/');
    await page.goto(`${server.url}/`);
    await page.waitForSelector('.card');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en', 'a saved Vietnamese choice must not leak onto /');
    assert.deepEqual(page.errors, []);
    await page.close();
  });

  it('on desktop the player, details and buttons fit one screen without scrolling', async () => {
    const both = data.videos.find((v) => Object.keys(v.langs).length > 1) ?? video; // language switch visible = the widest case
    for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 720]]) {
      const page = await open(`/${both.id}/`, { viewport: { width, height } });
      const r = await page.evaluate(() => {
        const card = document.querySelector('.modal-card');
        const tops = ['#share', '#prev', '#next'].map((q) => Math.round(document.querySelector(q).getBoundingClientRect().top));
        return { overflow: card.scrollHeight - card.clientHeight, rows: new Set(tops).size, fits: card.getBoundingClientRect().bottom <= innerHeight };
      });
      assert.deepEqual(r, { overflow: 0, rows: 1, fits: true }, `${width}x${height}`);
      await page.close();
    }
  });

  it('works with JavaScript disabled: the static page already shows the content', async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${server.url}/${video.id}/`);
    assert.equal(await page.textContent('h2'), video.langs.en.title);
    assert.ok((await page.locator('article.watch p').count()) > 2, 'transcript paragraphs');
    await ctx.close();
  });
});
