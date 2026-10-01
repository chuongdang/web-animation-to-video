import { $, go } from './dom.js';
import { state } from './state.js';
import { applyLang } from './lang.js';
import { applyRoute, parseUrl, syncUrl } from './routing.js';
import { render } from './browse.js';
import { close } from './player.js';

state.lang = parseUrl().lang;

$('#q').addEventListener('input', (e) => { state.query = e.target.value; render(); });
// the header logo goes back to the homepage: close the player, clear filters and search, scroll to top
document.querySelector('.brand').addEventListener('click', go(() => {
  close({ push: false });
  state.field = 'all';
  state.series = 'all';
  state.query = '';
  $('#q').value = '';
  render();
  syncUrl();
  scrollTo({ top: 0, behavior: 'smooth' });
}));
addEventListener('popstate', applyRoute);
applyLang({ route: false });
applyRoute();
// old #hash / ?lang= links: rewrite to the real URL
if (location.hash || /[?&]lang=/.test(location.search)) syncUrl({ replace: true });
