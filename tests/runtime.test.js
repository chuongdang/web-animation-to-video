// runtime/scene.js and runtime/kit.js run in the browser; here they load in Node with minimal stubs
// so the pure helpers (timing layout, easing, rng, paths) can be tested.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
globalThis.location = { search: '' };
globalThis.FontFace = class { async load() { return this; } };
globalThis.document = { fonts: { add() {} } };
await import('../runtime/scene.js');
const kit = await import('../runtime/kit.js');
const { Scene } = globalThis;

describe('Scene helpers', () => {
  it('clamp, lerp, range', () => {
    assert.equal(Scene.clamp(5, 0, 1), 1);
    assert.equal(Scene.clamp(-5), 0);
    assert.equal(Scene.lerp(10, 20, 0.25), 12.5);
    assert.equal(Scene.range(5, 0, 10), 0.5);
    assert.equal(Scene.range(-1, 0, 10), 0);
    assert.equal(Scene.range(99, 0, 10), 1);
  });

  it('easing curves hit their endpoints and are monotonic', () => {
    for (const f of [Scene.easeInOut, Scene.easeOut]) {
      assert.equal(f(0), 0);
      assert.equal(f(1), 1);
      let prev = -1;
      for (let k = 0; k <= 1; k += 0.05) { assert.ok(f(k) >= prev); prev = f(k); }
    }
    assert.equal(Scene.easeInOut(0.5), 0.5);
  });

  it('fadeWindow fades in after a and out before b', () => {
    const f = (t) => Scene.fadeWindow(t, 2, 10, 1, 1);
    assert.equal(f(1), 0);
    assert.equal(f(2.5), 0.5);
    assert.equal(f(5), 1);
    assert.equal(f(9.5), 0.5);
    assert.equal(f(11), 0);
  });

  it('rng is deterministic per seed and stays in [0, 1)', () => {
    const a = Scene.rng(42), b = Scene.rng(42), c = Scene.rng(43);
    const xs = Array.from({ length: 50 }, a);
    assert.deepEqual(xs, Array.from({ length: 50 }, b));
    assert.notDeepEqual(xs, Array.from({ length: 50 }, c));
    assert.ok(xs.every((x) => x >= 0 && x < 1));
  });

  it('define requires a positive duration', () => {
    assert.throws(() => Scene.define({}), /duration/);
  });
});

describe('kit drawing math', () => {
  it('pathAt walks a polyline by fraction of its length', () => {
    const pts = [[0, 0], [10, 0], [10, 10]];
    assert.deepEqual(kit.pathAt(pts, 0), [0, 0]);
    assert.deepEqual(kit.pathAt(pts, 0.25), [5, 0]);
    assert.deepEqual(kit.pathAt(pts, 0.75), [10, 5]);
    assert.deepEqual(kit.pathAt(pts, 1), [10, 10]);
    assert.deepEqual(kit.pathAt(pts, 2), [10, 10]);
    assert.deepEqual(kit.pathAt(pts, -1), [0, 0]);
  });

  it('repeat returns progress of the run in flight, or -1 when idle', () => {
    assert.equal(kit.repeat(0.5, 1, 2, 1), -1);      // before start
    assert.equal(kit.repeat(1.5, 1, 2, 1), 0.5);     // halfway through run 0
    assert.equal(kit.repeat(2.5, 1, 2, 1), -1);      // gap between runs
    assert.equal(kit.repeat(3.5, 1, 2, 1), 0.5);     // run 1
    assert.equal(kit.repeat(3.5, 1, 2, 1, 1), -1);   // count limit reached
  });
});

describe('narration timing', () => {
  const texts = { a: 'Hello [[world]] and [[more]]', b: 'Plain', outro: 'Bye' };
  const withTiming = async (timing) => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => (timing ? { ok: true, json: async () => timing } : { ok: false });
    try { return await kit.narration('f/s/n', texts); } finally { globalThis.fetch = realFetch; }
  };

  it('without timing.json it renders silent with fixed hold times and no audio cues', async () => {
    const nar = await withTiming(null);
    assert.equal(nar.spoken('a'), undefined);
    assert.deepEqual(nar.cue('a', 3), []);
    // 1.0 + 0.35 per extra keyword + HOLD(5) + 0.4 fade
    assert.ok(Math.abs(nar.capEnd('a', 0) - 6.75) < 1e-9);
    assert.ok(Math.abs(nar.capEnd('b', 0) - 6.4) < 1e-9);
  });

  it('with timing.json captions follow the speech and cues point at the wav', async () => {
    const nar = await withTiming({ a: { duration: 4 }, b: { duration: 2 } });
    assert.equal(nar.spoken('a'), 4);
    // start + LEAD + duration + hold(3.5) + 0.4
    assert.ok(Math.abs(nar.capEnd('a', 1) - 9.4) < 1e-9);
    assert.deepEqual(nar.cue('a', 10), [{ src: '/scenes/f/s/n/audio/a.wav', start: 10 + kit.LEAD }]);
  });

  it('plan lays chapters out back to back and mixes every spoken clip', async () => {
    const nar = await withTiming({ a: { duration: 4 }, b: { duration: 2 }, outro: { duration: 1 } });
    const { CS, T, AUDIO, DURATION } = kit.plan(nar, { one: ['a', 'b'] });
    assert.equal(CS.a, 0.6);
    assert.equal(CS.b, nar.capEnd('a', 0.6));
    assert.deepEqual(T.title, [0, 4]);
    assert.equal(T.one[0], 4);
    assert.equal(T.outro[0], T.one[1]);
    assert.deepEqual(AUDIO.map((c) => c.src.split('/').pop()), ['a.wav', 'b.wav', 'outro.wav']);
    assert.equal(DURATION, Math.ceil(T.outro[1] * 10) / 10);
  });

  it('plan honours { ids, first } and falls back to an 8s outro when it is not narrated', async () => {
    const nar = await withTiming(null);
    const { CS, T, AUDIO } = kit.plan(nar, { one: { ids: ['a'], first: 2 } }, { title: 3 });
    assert.equal(CS.a, 2);
    assert.deepEqual(T.title, [0, 3]);
    assert.equal(T.outro[1] - T.outro[0], 8);
    assert.deepEqual(AUDIO, []);
  });
});
