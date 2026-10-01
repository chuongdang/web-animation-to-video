import path from 'node:path';
import { startServer, ROOT } from './server.js';

const port = Number(process.env.PORT ?? 5180);
const { url } = await startServer(port, path.join(ROOT, 'site'));
console.log(`Video library: ${url}   (Ctrl+C to stop)`);
