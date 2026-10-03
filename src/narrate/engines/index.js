// Engines, in the order to prefer them. Each has: nativeSpeed, optional hashExtra(script, sceneDir) for cache-busting options,
// and synth(items, script, sceneDir) which writes items[i].wav for every { text, wav } given.
import chatterbox from './chatterbox.js';
import f5 from './f5.js';
import kokoro from './kokoro.js';
import edge from './edge.js';
import piper from './piper.js';

const engines = { chatterbox, f5, kokoro, edge, piper };

export function getEngine(name) {
  if (!engines[name]) throw new Error(`unknown engine "${name}" (use ${Object.keys(engines).join(', ')})`);
  return engines[name];
}
