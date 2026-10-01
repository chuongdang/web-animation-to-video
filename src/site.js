// Build the video library website in site/:  npm run site   (then: npm run site:serve)
//   - copies rendered videos from out/ into site/videos/<field>/<sub>/<name>[.<lang>].mp4 (one per language)
//   - extracts a poster frame for each video
//   - copies web/ (js/, style.css, brand/, ...) and renders web/index.html into site/
//   - writes site/data.js from scenes/**/meta.json and scenes/<field>/field.json
//   - writes crawlable HTML for every screen (home, subject, sub-category, video; en + other languages),
//     sitemap.xml, robots.txt, llms.txt and llms-full.txt
// The steps live in src/site/ (catalog, assets, pages, write-pages, crawler); this file only runs them in order.
import fs from 'node:fs';
import { SITE } from './site/config.js';
import { buildCatalog } from './site/catalog.js';
import { copyFonts, copyWeb } from './site/assets.js';
import { buildPages } from './site/pages.js';
import { writeData, writePages } from './site/write-pages.js';
import { writeCrawlerFiles } from './site/crawler.js';

// start from a clean site/ so nothing stale (removed videos, renamed pages) survives a rebuild
fs.rmSync(SITE, { recursive: true, force: true });

const site = buildCatalog();
copyWeb();
copyFonts();
const pages = buildPages(site);
writePages(pages);
writeData(site, pages);
writeCrawlerFiles(site, pages);

console.log(`site/: ${site.videos.length} videos in ${Object.keys(site.fields).length} subjects, languages: ${site.langCodes.join(', ')}; ${pages.length} pages`);
if (site.missing.length) console.log(`not rendered yet (skipped): ${site.missing.join(', ')}`);
