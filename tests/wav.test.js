import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { wavSeconds } from '../src/narrate/wav.js';

const chunk = (id, body) => {
  const h = Buffer.alloc(8);
  h.write(id, 0, 'ascii');
  h.writeUInt32LE(body.length, 4);
  return Buffer.concat([h, body, body.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0)]);
};
const fmt = (rate, bytesPerFrame, format = 1) => {
  const b = Buffer.alloc(16);
  b.writeUInt16LE(format, 0);
  b.writeUInt16LE(1, 2);
  b.writeUInt32LE(rate, 4);
  b.writeUInt32LE(rate * bytesPerFrame, 8);
  b.writeUInt16LE(bytesPerFrame, 12);
  b.writeUInt16LE(bytesPerFrame * 8, 14);
  return chunk('fmt ', b);
};
const wav = (...chunks) => Buffer.concat([Buffer.from('RIFF\0\0\0\0WAVE', 'latin1'), ...chunks]);
const seconds = (buf) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vc-wav-')), 't.wav');
  fs.writeFileSync(f, buf);
  try { return wavSeconds(f); } finally { fs.rmSync(path.dirname(f), { recursive: true, force: true }); }
};

describe('wavSeconds', () => {
  it('reads 16-bit PCM duration', () => {
    assert.equal(seconds(wav(fmt(24000, 2), chunk('data', Buffer.alloc(48000)))), 1);
  });

  it('reads 32-bit float duration', () => {
    assert.equal(seconds(wav(fmt(24000, 4, 3), chunk('data', Buffer.alloc(24000 * 4 * 2.5)))), 2.5);
  });

  it('skips unknown chunks, including odd-sized ones (padded)', () => {
    assert.equal(seconds(wav(fmt(1000, 2), chunk('LIST', Buffer.alloc(5)), chunk('data', Buffer.alloc(4000)))), 2);
  });

  it('clamps a data size that overruns the file', () => {
    const data = chunk('data', Buffer.alloc(2000));
    data.writeUInt32LE(0xffffffff, 4); // streamed wavs leave the size unset
    assert.equal(seconds(wav(fmt(1000, 2), data)), 1);
  });

  it('throws when there is no data chunk', () => {
    assert.throws(() => seconds(wav(fmt(1000, 2))), /no audio data/);
  });
});
