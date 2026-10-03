---
name: create-illustration-video
description: Make a narrated animated explainer video (MP4) about a topic with the video-creator project. Use when the user asks to create, generate or add a video / animation / explainer for a topic, or to add a scene to the video library.
---

# Create an illustration video for a topic

Repo: `{{REPO}}` (web animation -> MP4 renderer; scenes are canvas/SVG pages rendered frame by frame by headless Chromium, narrated by local TTS). Run every command from there. If `node` is not found, load your version manager first (e.g. `source ~/.nvm/nvm.sh`). First time on a machine: `npm install && npm run setup`.

Read `{{REPO}}/CLAUDE.md` once for the architecture and `{{REPO}}/scenes/_template/scene.js` for the scene skeleton. Use a finished scene on a similar topic as the style reference (e.g. `scenes/software-engineering/scrum/why-scrum/`).

## 1. Plan

- Topic and audience: if the user gave neither a depth nor an audience, assume curious non-experts, 60-120 s.
- Pick the id `<field>/<sub>/<name>` (kebab-case). `ls scenes/*/` to reuse an existing field (subject) and sub (series folder); a new field needs `scenes/<field>/field.json` (`title`, `blurb`, `color`, `order`).
- Internal / private topics (not for the public site): use field `internal`, i.e. `internal/<sub>/<name>`. That folder is git-ignored and never built into the site.
- Outline 3-5 chapters, each one idea, and decide what each chapter *shows* (a diagram, a flow, a counter, a comparison), not just says.

## 2. Scaffold

```bash
npm run new -- <field>/<sub>/<name> "Title"
```

Creates `index.html`, `scene.js`, `narration.json` from the template. Add `meta.json` next to them:

```json
{ "title": "...", "summary": "one or two sentences", "tags": ["..."], "series": "Series display name", "order": 1 }
```

## 3. Write the narration first

`narration.json`: `{ "voice": "af_heart", "speed": 0.95, "lines": { "id": "text", ... } }`. Narration drives timing, so write it before the drawing.

- 8-14 short lines, one idea each, plain spoken English, under ~25 words. Chapter ids like `p1`..`p5`, `s1`.., ending with an `outro` line.
- Pick the TTS with `"engine"`: `kokoro` (default, English), `chatterbox` / `f5` (natural, voice cloning via `"ref"`), `edge` (cloud, Vietnamese), `piper` last resort.
- In `scene.js` the caption text for each id lives in `TXT` with `[[keyword]]` or `[[keyword:electron]]` highlights (colours: electron, proton, gold, copper, green).

## 4. Write the scene

`scene.js` imports helpers from `/runtime/kit.js` (palette `C`, `label`, `chip`, `panel`, `arrow`, `bar`, `treeNode`, `cycle`, `card`, `glowDot`, `chapterTag`, `titleCard`, `plan`, `speech`, `mount`, `chapterAlpha`; also `/runtime/widgets.js`). Follow the template: `narration(id, TXT)` -> `plan(nar, { chapter: [lineIds] })` -> `mount({ plan, init, draws })`.

Hard rules (the renderer relies on them):
- A scene is a pure function of `t`: no `Date.now`, `requestAnimationFrame`, `Math.random` (use `Scene.rng(seed)`).
- Time visuals to speech with `sp('lineId', fraction)` so things appear as they are spoken.
- Fonts/images load locally before `Scene.define` resolves. No network assets.
- Keep files small: past ~150-200 lines split drawing helpers into sibling modules (see `parts.js`, `later.js` in existing scenes). Shared helpers that two scenes need go in `runtime/kit.js`.
- Show, don't tell: every chapter needs a distinct visual; avoid walls of text on screen.

## 5. Narrate, check, render

```bash
npm run narrate -- <id>              # audio/*.wav + timing.json (cached per line; re-run after editing text)
npm run preview -- <id> [secs]       # low-res silent render + contact sheet at out/preview/<name>.png
```

Open the contact sheet PNG and look at it: overlapping text, off-screen elements, empty stretches, wrong order. Fix `scene.js`, re-run `preview` until clean. Then:

```bash
npm run make -- <id>                 # narrate + render -> out/<field>/<sub>/<name>.mp4
```

Optional: Vietnamese `narration.vi.json` + `"vi"` block in `meta.json`, then `npm run narrate -- <id> --lang vi` and `npm run render -- <id> --lang vi`.

## 6. Finish

- Confirm `out/<id>.mp4` exists and report its path and duration.
- Public scenes appear on the site after `npm run site` (and `npm test` if `src/site.js` / `web/` changed). Internal scenes never do.
- Do not run `npm run deploy` or commit unless the user asks.
- Helper scripts you write go in `src/` with an npm script, never in /tmp.
