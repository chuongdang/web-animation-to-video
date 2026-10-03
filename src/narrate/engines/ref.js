// shared by the voice-cloning engines: the optional reference clip ("ref" in narration.json, relative to the scene)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const refPath = (script, sceneDir) => (script.ref ? path.resolve(sceneDir, script.ref) : '');

/** content hash of the clip, so swapping the file regenerates the cached lines */
export function refHash(script, sceneDir) {
  const ref = refPath(script, sceneDir);
  return ref ? crypto.createHash('sha1').update(fs.readFileSync(ref)).digest('hex').slice(0, 12) : '';
}
