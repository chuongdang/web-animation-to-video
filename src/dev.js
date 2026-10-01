import { startServer, listScenes } from './server.js';

const port = Number(process.env.PORT ?? 5173);
const { url } = await startServer(port);
console.log(`Preview server: ${url}`);
for (const s of listScenes()) console.log(`  ${s.id.padEnd(34)} ${url}/scenes/${s.id}/index.html`);
console.log('\nSpace = play/pause, drag the slider to scrub. Ctrl+C to stop.');
