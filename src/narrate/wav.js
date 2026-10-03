import fs from 'node:fs';

/** wav duration in seconds; walks the chunks so 16-bit PCM and 32-bit float files both work */
export function wavSeconds(file) {
  const b = fs.readFileSync(file);
  let rate = 0, bytesPerFrame = 0;
  for (let at = 12; at + 8 <= b.length; ) {
    const id = b.toString('ascii', at, at + 4);
    const size = b.readUInt32LE(at + 4);
    if (id === 'fmt ') { rate = b.readUInt32LE(at + 12); bytesPerFrame = b.readUInt16LE(at + 20); }
    if (id === 'data') return Math.min(size, b.length - at - 8) / bytesPerFrame / rate;
    at += 8 + size + (size & 1);
  }
  throw new Error(`no audio data in ${file}`);
}
