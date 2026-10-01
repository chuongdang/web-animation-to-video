// Narrate + render one or more scenes in one go.
//   npm run make -- physics/electricity biology/respiration
//   npm run make -- --all             (every scene)
//   npm run make -- --field biology   (every scene in a field)
//   npm run make -- --sub how-ai-works (every scene in a sub-category)
// Extra flags after "--" are not forwarded; use `npm run render` for custom fps/width.
import { spawnSync } from 'node:child_process';
import { listScenes, resolveScene } from './server.js';

const args = process.argv.slice(2);
let scenes;
if (args.includes('--all')) scenes = listScenes();
else if (args[0] === '--field') scenes = listScenes().filter((s) => s.field === args[1]);
else if (args[0] === '--sub') scenes = listScenes().filter((s) => s.sub === args[1]);
else scenes = args.map(resolveScene);

if (!scenes.length) {
  console.error('Usage: npm run make -- <field>/<sub>/<name> ... | --all | --field <field> | --sub <sub>');
  process.exit(1);
}
for (const s of scenes) {
  console.log(`\n=== ${s.id} ===`);
  for (const script of ['narrate.js', 'render.js']) {
    const r = spawnSync('node', [`src/${script}`, s.id], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}
