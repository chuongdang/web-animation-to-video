# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Turns web animations (canvas/SVG/DOM/CSS) into MP4s. The renderer (`src/render.js`) drives headless Chromium frame by frame: for each frame it calls `window.setTime(t)`, screenshots (JPEG q95, parallel workers, written to ffmpeg in order), and mixes in narration audio. Full usage is in [README.md](README.md). Tests (`npm test`, Node's built-in runner) cover the site build, the SPA and the unit-testable modules (see Architecture > Tests); there is no linter.

## Commands

```bash
npm run setup                          # install Playwright Chromium (once)
npm run dev                            # live preview + scrubber at :5173 (no sound)
npm run new -- <field>/<sub>/<name> "Title"  # scaffold scene from scenes/_template
npm run narrate -- <field>/<sub>/<name>  # Kokoro TTS -> audio/*.wav + audio/timing.json (cached per line)
npm run render -- <field>/<sub>/<name> [--fps 60] [--width 1280] [-j 8] [--crf 18] [-o out/x.mp4]
npm run make -- <field>/<sub>/<name>  # narrate + render (also: --all, --field <field>, --sub <sub>)
npm run narrate -- <field>/<sub>/<name> --lang vi   # Vietnamese narration (edge-tts) -> audio/vi/
npm run render -- <field>/<sub>/<name> --lang vi    # -> out/<field>/<sub>/<name>.vi.mp4
npm run preview -- <scene> [secs]       # low-res render + contact sheet at out/preview/<name>.png to eyeball a scene
npm run og                             # regenerate web/brand/og.png (link-preview card) via src/og-image.js
npm run site                           # build site/ from web/ (source) + out/ (videos, posters, data.js)
npm run skill:install                  # install skills/create-illustration-video into ~/.claude/skills (--uninstall, --dest <dir>)
npm test                               # build the site into a temp dir (SITE_DIR, SITE_URL=https://example.test), then tests/*.test.js
```

Any unique tail of the id resolves (`electricity`, `electricity-basics/electricity`). `make` does not forward extra flags to `render`.

## Claude skill

`skills/create-illustration-video/SKILL.md` is the workflow for turning a topic into a video (plan, scaffold, narration, scene, preview, render). `src/install-skill.js` copies every `skills/<name>/` to `~/.claude/skills/` and fills the `{{REPO}}` placeholder with this repo's path, so the skill works from any directory; edit the source in `skills/`, then re-run the install.

## Architecture

- **Scene contract** (`runtime/scene.js`): a scene calls `Scene.define({width, height, duration, init, draw|update, audio})`. It must be a *pure function of `t`* — no `Date.now`, `requestAnimationFrame`, or `Math.random` (use `Scene.rng(seed)`). CSS/Web Animations are auto-seeked. The page signals readiness via `window.__sceneReady`, and exposes `window.__scene` (metadata the renderer reads) and `window.setTime`. Fonts/images must load locally before `Scene.define` resolves.
- **Narration drives timing**: `narration.json` (voice, speed, one text per id) -> `audio/timing.json`. Scenes read `timing.json` (via `plan()` in `runtime/kit.js`) to lay out captions/keyword highlights, and list clips in `audio: [{src, start}]` for the renderer to mix. Without `timing.json` a scene renders silent with fixed hold times, so re-run `narrate` after editing narration text.
- **`runtime/kit.js`**: shared palette, fonts, canvas helpers, `plan()`, `mount()`, `titleCard()`, narrated keyword captions. Prefer extending it over per-scene duplication.
- **`src/server.js`**: static server + scene discovery (`listScenes`, `resolveScene`), shared by dev and render.
- **Scenes** live at `scenes/<field>/<sub>/<name>/` (field = subject, sub = sub-category folder such as `how-ai-works`; scene dir holds `index.html`, `scene.js`, `narration.json`, `audio/`, optional `meta.json`); each field has `scenes/<field>/field.json`. The scene id is the full `field/sub/name` path, and `scene.js` passes it to `narration()`. Output goes to `out/<field>/<sub>/<name>.mp4`.
- **Library site** (source in `web/`: `js/` (ES modules), `style.css`, `brand/`, `index.html` template; `src/site.js` + `src/site/` build it into `site/`): static site grouped by field then `meta.json` series/order; scenes without a rendered video are skipped. `site/` is entirely build output and git-ignored (`npm run site` deletes it first and rebuilds from scratch): edit `web/`, never `site/`. Video/poster URLs in `data.js` carry `?v=<render mtime>` because hosts cache them for days; `index.html` asset links get a per-build `?v=` and js/css should be served with `no-cache`.
- **Tests** (`tests/`): `build.js` builds the site into `$TMPDIR/video-creator-test-site` (never the real `site/`; needs rendered videos in `out/`, otherwise the tests are skipped); `site.test.js` checks the generated HTML (titles, canonicals, JSON-LD, links resolve, sitemap/hreflang, llms files); `spa.test.js` drives the app in Playwright Chromium (needs `npm run setup`). Run `npm test` after changing `src/site.js`, `web/` or the URL scheme.
- **Unit and fixture tests** (no real renders needed): `server.test.js` (scene discovery/`resolveScene`, static server incl. ranges and path traversal), `wav.test.js`, `retry.test.js` (`src/narrate/retry.js`, `edgeRate`), `render-stats.test.js` (`src/render/stats.js`), `site-helpers.test.js` (`src/site/config.js` helpers, `model.js` URLs), `runtime.test.js` (`runtime/scene.js` + `kit.js` loaded in Node with stubs), `cli.test.js` (`install-skill`, `new`). `site-build.test.js` and `render.test.js` run the real `src/site.js` / `src/render.js` against a throwaway project built by `tests/fixture.js` (tiny ffmpeg videos, scenes, a copy of `web/`); `render.test.js` needs Chromium and skips without it. The `VC_ROOT` env var points `src/server.js` (`ROOT`) at another project tree, which is how the fixtures work.
- **Keep tests in step with code**: whenever you change behaviour (a `src/` module, `runtime/`, `web/`, the URL scheme, CLI flags), update or add the matching test in `tests/` in the same change, and run `npm test` before finishing. New pure helpers get a unit test; new pages/routes get a case in `site.test.js`/`spa.test.js`. Don't weaken or delete a test just to make it pass unless the behaviour was intentionally changed.
- **SEO / crawlable pages**: the app is an SPA, but `src/site.js` also writes real HTML for every screen (`/`, `/<field>/`, `/<field>/<sub>/` when a field has 2+ subs, `/<field>/<sub>/<name>/` for each video; other languages get a `/vi/` prefix on all of them; a URL without a prefix is always English, the browser language and saved choices are ignored) from the `web/index.html` template (`<!--SEO-->` head, `<!--H1-->`, `<!--MAIN-->` markers; asset paths must stay absolute). Each page has its own title/description/canonical/hreflang/og tags and JSON-LD (`WebSite`, `CollectionPage`+`ItemList`, `VideoObject` with the narration as `transcript`, `BreadcrumbList`); watch pages carry the video and full transcript. `web/js/` uses real URLs (history API, no hashes; old `#hash` / `?lang=` links are rewritten), tabs/cards/headings are `<a href>` with click interception so navigation stays SPA, and `updateHead()` keeps `<title>`/description/`<h1>` in step using `SITE.pages` in `data.js`. Also generated: `sitemap.xml` (with hreflang + video entries), `robots.txt`, `llms.txt`, `llms-full.txt` (all transcripts). Subject folder names must not collide with `brand`, `fonts`, `videos`, `posters` or a language code (build throws). Absolute URLs use `SITE_URL` from `.env` (git-ignored; see `.env.example`); unset = canonical/og/JSON-LD/sitemap omitted. The player's Copy link button copies the video's own URL. Old `/v/<id>/` URLs 301 to the new ones via `deploy/nginx.conf`.

## Languages

A scene can have language variants. `--lang <code>` on `narrate`/`render` reads `narration.<code>.json`, writes `audio/<code>/`, loads the page with `?lang=<code>` (exported as `LANG` from `runtime/kit.js`) and outputs `<name>.<code>.mp4`. The scene picks its on-screen strings by `LANG` (see the `STR` table in `scenes/physics/electricity/scene.js`). `narration.json` `engine` picks the TTS (modules in `src/narrate/engines/`, each with `synth(items, script, sceneDir)`; Python ones run a script from `src/narrate/py/` in their own venv): `chatterbox` and `f5` (local, natural, voice cloning via `ref`; Python 3.11 venv through `uv`), `kokoro` (default, English only), `piper` (local; flat-sounding Vietnamese, last resort), or `edge` (Microsoft Edge neural voices via `edge-tts`: free, no key, but sends the text to Microsoft and occasionally drops requests, so `narrate.js` retries). Piper/edge run in a venv auto-created at `~/.cache/video-creator` (needs `python3`). Vietnamese uses `"engine": "edge"`, `"voice": "vi-VN-HoaiMyNeural"` (alt: `vi-VN-NamMinhNeural`); changing engine/voice/speed regenerates the cached lines. edge speed maps to a `--rate` percentage, so `0.95` = `-5%`. Vietnamese glyphs need the `vietnamese` fontsource subset, which `kit.js` loads when `LANG === 'vi'`. `make` doesn't handle language variants yet.

**Site:** `src/site.js` picks up `out/<field>/<sub>/<name>.<lang>.mp4` alongside the English `<name>.mp4`; each video's `langs` entry in `site/data.js` holds that language's title/summary/tags/series/video/poster. Text is translated with a `"vi": {...}` block in `meta.json` (title, summary, tags, series) and `field.json` (title, blurb); missing fields fall back to English. `web/js/` shows a language switcher (and UI strings in its `UI` table) only when more than one language has videos, lists only videos rendered in the selected language, and offers a per-video language switch in the player. A subject's sub-categories are its `<sub>` folders (display name = the `series` text in each scene's `meta.json`, translated in its `"vi"` block): selecting a subject with 2+ sub-categories shows chips under the tabs to filter. The URL mirrors the screen (path routing in `web/js/routing.js`, see the SEO bullet), so refresh, back/forward and shared links land in the same place; old `#field/name` links still resolve. The header logo resets to the homepage (closes the player, clears search/subject filter); the footer is just `© 2026`. Adding another language means: a label in `LANG_NAMES` (`src/site.js`), a `UI` entry (`web/js/`), and font subsets if it isn't Latin/Vietnamese.

## Code organisation

Keep files small and single-purpose; split a file before it grows past ~150-200 lines or starts mixing concerns. Don't add logic to a big file out of convenience — put it in the module it belongs to, or create one.

- `web/js/` is native ES modules (no bundler), entry `main.js`: `dom.js` (`$`, `el`, `go`), `state.js` (shared mutable state, incl. `state.current`/`state.watched`), `store.js` (localStorage), `catalog.js` (`window.SITE` data + lookups), `i18n.js` (`UI` strings, flags), `routing.js` (URLs, `syncUrl`, `applyRoute`), `lang.js`, `browse.js` (tabs/cards/`render`), `player.js` (modal). Modules may import each other cyclically, but only call across the cycle from functions, never at load time.
- Add a new module rather than extending `main.js`; `main.js` only wires events and boots.
- `src/` entry points (`render.js`, `narrate.js`, `site.js`, ...) stay thin and are wired to npm scripts in `package.json`; when one grows, move the logic into a folder of the same name. `src/site.js` is the model: it only runs the steps in `src/site/` in order (`config.js` paths/env/helpers, `catalog.js` scan + copy videos/posters, `assets.js`, `model.js` URLs/lookups, `text.js` per-language strings, `html.js` + `pages.js` the crawlable pages, `write-pages.js` templates + `data.js`, `crawler.js` sitemap/robots/llms). The build steps pass a `site` object (`{fields, videos, langCodes}`) instead of using module globals.
- Same rule for `runtime/`: one concern per file, shared helpers in `runtime/kit.js`.

## Notes

- ffmpeg comes from `ffmpeg-static`; nothing system-wide is required. Node >= 20, ESM (`"type": "module"`).
- `out/`, `node_modules/`, `site/` and every scene's `audio/` (wavs + `timing.json`, ~160 MB) are git-ignored: after cloning, run `npm run narrate` (or `make`) to regenerate them.
