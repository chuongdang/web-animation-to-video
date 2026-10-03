// Runs the real site build (src/site.js) against a fixture project, so edge cases that the real
// library does not currently contain (fallbacks, skipped scenes, reserved names, no SITE_URL) stay covered.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeProject, runTool } from './fixture.js';

const ORIGIN = 'https://fixture.test';
const data = (dir) => new Function('window', `${fs.readFileSync(path.join(dir, 'data.js'), 'utf8')}\nreturn window.SITE;`)({});

describe('site build on a fixture project', () => {
  let proj, site, run;
  before(() => {
    proj = makeProject();
    site = proj.path('site');
    run = (extra = {}) => runTool(proj, 'site.js', [], { SITE_DIR: site, SITE_URL: ORIGIN, ...extra });
    proj.write('scenes/physics/field.json', { title: 'Physics', blurb: 'B', order: 1, vi: { title: 'Vật lý' } });
    proj.scene('physics/basics/alpha', {
      'meta.json': { title: 'Alpha', summary: 'English summary', tags: ['a'], series: 'Basics', order: 2, vi: { title: 'Anpha', series: 'Cơ bản' } },
      'narration.json': { lines: { one: 'First line.', two: 'Second line.' } },
      'narration.vi.json': { lines: { one: 'Dòng một.' } },
    });
    proj.scene('physics/basics/beta'); // no meta.json: title comes from the folder name
    proj.scene('physics/other/gamma', { 'meta.json': { series: 'Other' } });
    proj.scene('physics/basics/unrendered');
    proj.scene('internal/scratch/hidden');
    for (const f of ['physics/basics/alpha.mp4', 'physics/basics/alpha.vi.mp4', 'physics/basics/beta.mp4', 'physics/other/gamma.mp4', 'internal/scratch/hidden.mp4']) proj.video(f);
  });
  after(() => proj.cleanup());

  it('builds, skipping unrendered and internal scenes', () => {
    const r = run();
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /3 videos in 1 subjects, languages: en, vi/);
    assert.match(r.stdout, /not rendered yet \(skipped\): physics\/basics\/unrendered/);
    const d = data(site);
    assert.deepEqual(d.videos.map((v) => v.id).sort(), ['physics/basics/alpha', 'physics/basics/beta', 'physics/other/gamma']);
    assert.ok(!fs.existsSync(path.join(site, 'internal')));
  });

  it('uses meta.json text, falls back to folder names, and overlays the vi block', () => {
    const d = data(site);
    const by = Object.fromEntries(d.videos.map((v) => [v.name, v]));
    assert.equal(by.alpha.langs.en.title, 'Alpha');
    assert.equal(by.alpha.langs.vi.title, 'Anpha');
    assert.equal(by.alpha.langs.vi.summary, 'English summary'); // not translated: falls back
    assert.equal(by.alpha.langs.vi.series, 'Cơ bản');
    assert.equal(by.beta.langs.en.title, 'Beta');
    assert.equal(by.beta.series, 'General');
    assert.deepEqual(by.alpha.langs.en.transcript, ['First line.', 'Second line.']);
    assert.deepEqual(by.alpha.langs.vi.transcript, ['Dòng một.']);
    assert.ok(by.alpha.langs.en.seconds >= 3);
  });

  it('versions video and poster URLs with the render mtime, and writes both files', () => {
    const v = data(site).videos.find((x) => x.name === 'alpha').langs.en;
    assert.match(v.video, /^videos\/physics\/basics\/alpha\.mp4\?v=\w+$/);
    assert.match(v.poster, /^posters\/physics\/basics\/alpha\.jpg\?v=\w+$/);
    assert.ok(fs.existsSync(path.join(site, 'videos/physics/basics/alpha.vi.mp4')));
    assert.ok(fs.existsSync(path.join(site, 'posters/physics/basics/alpha.jpg')));
  });

  it('sorts videos by sub-category, then meta order (default last), and translates the field', () => {
    const d = data(site);
    assert.deepEqual(d.videos.map((v) => v.name), ['alpha', 'beta', 'gamma']);
    const physics = d.fields.find((f) => f.id === 'physics');
    assert.equal(physics.text.vi.title, 'Vật lý');
    assert.equal(physics.text.vi.blurb, 'B'); // not translated: falls back
  });

  it('only languages with videos get pages; vi lists only its own videos', () => {
    assert.ok(fs.existsSync(path.join(site, 'vi/index.html')));
    assert.ok(fs.existsSync(path.join(site, 'vi/physics/basics/alpha/index.html')));
    assert.ok(!fs.existsSync(path.join(site, 'vi/physics/basics/beta/index.html')));
    assert.ok(fs.existsSync(path.join(site, 'physics/basics/index.html'))); // 2 subs -> sub pages
  });

  it('puts absolute URLs in canonical tags and the sitemap when SITE_URL is set', () => {
    const html = fs.readFileSync(path.join(site, 'physics/basics/alpha/index.html'), 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/physics/basics/alpha/">`));
    assert.ok(fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8').includes(`${ORIGIN}/vi/physics/basics/alpha/`));
    assert.ok(fs.readFileSync(path.join(site, 'robots.txt'), 'utf8').includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
  });

  it('omits canonical/og URLs and the sitemap line when SITE_URL is empty', () => {
    const r = run({ SITE_URL: '' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /SITE_URL is not set/);
    const html = fs.readFileSync(path.join(site, 'physics/basics/alpha/index.html'), 'utf8');
    assert.ok(!html.includes('rel="canonical"'));
    assert.ok(!fs.readFileSync(path.join(site, 'robots.txt'), 'utf8').includes('Sitemap:'));
  });

  it('wipes stale output on rebuild', () => {
    fs.writeFileSync(path.join(site, 'stale.txt'), 'x');
    assert.equal(run().status, 0);
    assert.ok(!fs.existsSync(path.join(site, 'stale.txt')));
  });

  it('drops a video from the site once its render is removed', () => {
    fs.rmSync(proj.path('out/physics/other/gamma.mp4'));
    assert.equal(run().status, 0);
    assert.ok(!fs.existsSync(path.join(site, 'physics/other/gamma/index.html')));
    assert.ok(!fs.existsSync(path.join(site, 'physics/other/index.html'))); // back to 1 sub
  });
});

describe('site build errors', () => {
  for (const reserved of ['brand', 'fonts', 'videos', 'posters', 'vi']) {
    it(`rejects a subject folder named "${reserved}"`, () => {
      const proj = makeProject();
      try {
        proj.scene(`${reserved}/s/n`, { 'meta.json': {} });
        proj.video(`${reserved}/s/n.mp4`);
        proj.video(`${reserved}/s/n.vi.mp4`);
        const r = runTool(proj, 'site.js', [], { SITE_DIR: proj.path('site'), SITE_URL: ORIGIN });
        assert.notEqual(r.status, 0);
        assert.match(r.stderr, /collides with a reserved site path/);
      } finally {
        proj.cleanup();
      }
    });
  }
});
