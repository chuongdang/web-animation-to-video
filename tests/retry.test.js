import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { retry } from '../src/narrate/retry.js';
import { edgeRate } from '../src/narrate/engines/edge.js';

describe('retry', () => {
  it('returns the result without retrying when the first call works', () => {
    let calls = 0;
    assert.equal(retry(() => (calls++, 'ok')), 'ok');
    assert.equal(calls, 1);
  });

  it('retries a flaky call and reports each retry', () => {
    let calls = 0;
    const seen = [];
    const out = retry(() => { if (++calls < 3) throw new Error('dropped'); return 'ok'; }, { onRetry: (n) => seen.push(n) });
    assert.equal(out, 'ok');
    assert.equal(calls, 3);
    assert.deepEqual(seen, [1, 2]);
  });

  it('gives up after `attempts` calls and rethrows the last error', () => {
    let calls = 0;
    assert.throws(() => retry(() => { throw new Error(`fail ${++calls}`); }, { attempts: 4 }), /fail 4/);
    assert.equal(calls, 4);
  });

  it('defaults to 4 attempts', () => {
    let calls = 0;
    assert.throws(() => retry(() => { calls++; throw new Error('x'); }));
    assert.equal(calls, 4);
  });
});

describe('edgeRate', () => {
  it('maps speed to a signed percentage for edge-tts', () => {
    assert.equal(edgeRate(1), '+0%');
    assert.equal(edgeRate(0.95), '-5%');
    assert.equal(edgeRate(1.2), '+20%');
    assert.equal(edgeRate(0.5), '-50%');
  });
});
