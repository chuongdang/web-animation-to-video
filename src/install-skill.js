// Install the Claude Code skills in skills/ into ~/.claude/skills so they work from any directory.
//   npm run skill:install                 copy every skills/<name>/ (the {{REPO}} placeholder becomes this repo's path)
//   npm run skill:install -- --uninstall  remove them again
//   npm run skill:install -- --dest <dir> install somewhere else (default ~/.claude/skills)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './server.js';

const argv = process.argv.slice(2);
const di = argv.indexOf('--dest');
const dest = path.resolve(di >= 0 ? argv[di + 1] : path.join(os.homedir(), '.claude', 'skills'));
const uninstall = argv.includes('--uninstall');
const src = path.join(ROOT, 'skills');

/** copy a skill folder, filling in {{REPO}} in text files */
function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copy(a, b);
    else if (/\.(md|txt|json|js|sh)$/.test(e.name)) fs.writeFileSync(b, fs.readFileSync(a, 'utf8').replaceAll('{{REPO}}', ROOT));
    else fs.copyFileSync(a, b);
  }
}

const skills = fs.readdirSync(src, { withFileTypes: true }).filter((e) => e.isDirectory() && fs.existsSync(path.join(src, e.name, 'SKILL.md')));
for (const { name } of skills) {
  const to = path.join(dest, name);
  fs.rmSync(to, { recursive: true, force: true });
  if (uninstall) {
    console.log(`removed   ${to}`);
    continue;
  }
  copy(path.join(src, name), to);
  console.log(`installed ${to}`);
}
if (!uninstall) console.log('Restart Claude Code (or start a new session) to pick the skill up, then ask e.g. "make a video about how DNS works".');
