# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Turns web animations (canvas/SVG/DOM/CSS) into MP4s. The renderer (`src/render.js`) drives headless Chromium frame by frame: for each frame it calls `window.setTime(t)`, screenshots (JPEG q95, parallel workers, written to ffmpeg in order), and mixes in narration audio. Full usage is in [README.md](README.md). No test suite or linter exists.

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
```

Any unique tail of the id resolves (`electricity`, `electricity-basics/electricity`). `make` does not forward extra flags to `render`.

## Architecture

- **Scene contract** (`runtime/scene.js`): a scene calls `Scene.define({width, height, duration, init, draw|update, audio})`. It must be a *pure function of `t`* — no `Date.now`, `requestAnimationFrame`, or `Math.random` (use `Scene.rng(seed)`). CSS/Web Animations are auto-seeked. The page signals readiness via `window.__sceneReady`, and exposes `window.__scene` (metadata the renderer reads) and `window.setTime`. Fonts/images must load locally before `Scene.define` resolves.
- **Narration drives timing**: `narration.json` (voice, speed, one text per id) -> `audio/timing.json`. Scenes read `timing.json` (via `plan()` in `runtime/kit.js`) to lay out captions/keyword highlights, and list clips in `audio: [{src, start}]` for the renderer to mix. Without `timing.json` a scene renders silent with fixed hold times, so re-run `narrate` after editing narration text.
- **`runtime/kit.js`**: shared palette, fonts, canvas helpers, `plan()`, `mount()`, `titleCard()`, narrated keyword captions. Prefer extending it over per-scene duplication.
- **`src/server.js`**: static server + scene discovery (`listScenes`, `resolveScene`), shared by dev and render.
- **Scenes** live at `scenes/<field>/<sub>/<name>/` (field = subject, sub = sub-category folder such as `how-ai-works`; scene dir holds `index.html`, `scene.js`, `narration.json`, `audio/`, optional `meta.json`); each field has `scenes/<field>/field.json`. The scene id is the full `field/sub/name` path, and `scene.js` passes it to `narration()`. Output goes to `out/<field>/<sub>/<name>.mp4`.
- **Library site** (source in `web/`: `app.js`, `style.css`, `brand/`, `index.html` template; `src/site.js` builds it into `site/`): static site grouped by field then `meta.json` series/order; scenes without a rendered video are skipped. `site/` is entirely build output and git-ignored: edit `web/`, never `site/`. Video/poster URLs in `data.js` carry `?v=<render mtime>` because hosts cache them for days; `index.html` asset links get a per-build `?v=` and js/css should be served with `no-cache`.
- **Link previews**: `web/index.html` (template for the generated `site/index.html`) carries static `og:`/`twitter:` tags (image `web/brand/og.png`, 1200×630). Crawlers ignore `#hash` routes, so `src/site.js` also writes share pages `site/v/<id>/` (and `/v/<id>/<lang>/`) with per-video og tags (title, summary, poster) that redirect into the app; the player's Copy link button copies that URL. Absolute URLs use `SITE_URL` from `.env` (git-ignored; see `.env.example`); unset = og tags omitted.

## Languages

A scene can have language variants. `--lang <code>` on `narrate`/`render` reads `narration.<code>.json`, writes `audio/<code>/`, loads the page with `?lang=<code>` (exported as `LANG` from `runtime/kit.js`) and outputs `<name>.<code>.mp4`. The scene picks its on-screen strings by `LANG` (see the `STR` table in `scenes/physics/electricity/scene.js`). `narration.json` `engine` picks the TTS: `kokoro` (default, English only), `piper` (local; flat-sounding Vietnamese), or `edge` (Microsoft Edge neural voices via `edge-tts`: free, no key, but sends the text to Microsoft and occasionally drops requests, so `narrate.js` retries). Piper/edge run in a venv auto-created at `~/.cache/video-creator` (needs `python3`). Vietnamese uses `"engine": "edge"`, `"voice": "vi-VN-HoaiMyNeural"` (alt: `vi-VN-NamMinhNeural`); changing engine/voice/speed regenerates the cached lines. edge speed maps to a `--rate` percentage, so `0.95` = `-5%`. Vietnamese glyphs need the `vietnamese` fontsource subset, which `kit.js` loads when `LANG === 'vi'`. `make` doesn't handle language variants yet.

**Site:** `src/site.js` picks up `out/<field>/<sub>/<name>.<lang>.mp4` alongside the English `<name>.mp4`; each video's `langs` entry in `site/data.js` holds that language's title/summary/tags/series/video/poster. Text is translated with a `"vi": {...}` block in `meta.json` (title, summary, tags, series) and `field.json` (title, blurb); missing fields fall back to English. `web/app.js` shows a language switcher (and UI strings in its `UI` table) only when more than one language has videos, lists only videos rendered in the selected language, and offers a per-video language switch in the player. A subject's sub-categories are its `<sub>` folders (display name = the `series` text in each scene's `meta.json`, translated in its `"vi"` block): selecting a subject with 2+ sub-categories shows chips under the tabs to filter. The URL mirrors the screen (hash routing in `web/app.js`: `#<subject>`, `#<subject>/<sub>`, `#<subject>/<sub>/<video>`, plus `?lang=`), so refresh, back/forward and shared links land in the same place; old `#field/name` links still resolve. The header logo resets to the homepage (closes the player, clears search/subject filter); the footer is just `© 2026`. Adding another language means: a label in `LANG_NAMES` (`src/site.js`), a `UI` entry (`web/app.js`), and font subsets if it isn't Latin/Vietnamese.

## Notes

- ffmpeg comes from `ffmpeg-static`; nothing system-wide is required. Node >= 20, ESM (`"type": "module"`).
- `out/`, `node_modules/`, `site/` and every scene's `audio/` (wavs + `timing.json`, ~160 MB) are git-ignored: after cloning, run `npm run narrate` (or `make`) to regenerate them.
