// Create a scene from the template:  npm run new -- computer-science/how-ai-works/backpropagation "Backpropagation"
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.js';

const [ref, title = 'New scene'] = process.argv.slice(2);
if (!/^[\w-]+\/[\w-]+\/[\w-]+$/.test(ref ?? '')) {
  console.error('Usage: npm run new -- <field>/<sub-category>/<name> "Title"');
  process.exit(1);
}
const dir = path.join(ROOT, 'scenes', ref);
if (fs.existsSync(dir)) {
  console.error(`${ref} already exists`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
const tpl = path.join(ROOT, 'scenes', '_template');
for (const f of fs.readdirSync(tpl)) {
  const text = fs.readFileSync(path.join(tpl, f), 'utf8').replaceAll('__ID__', ref).replaceAll('__TITLE__', title);
  fs.writeFileSync(path.join(dir, f), text);
}
console.log(`Created scenes/${ref}. Edit narration.json and scene.js, then: npm run make -- ${ref}`);
