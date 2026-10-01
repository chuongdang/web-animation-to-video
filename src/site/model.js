// URLs and lookups over the catalog (`site` = { fields, videos, langCodes }); mirrors the app's routing in web/js/routing.js
const pfx = (lang) => (lang === 'en' ? '' : `/${lang}`);
export const homePath = (lang) => `${pfx(lang)}/`;
export const fieldPath = (lang, f) => `${pfx(lang)}/${f}/`;
export const subPath = (lang, f, s) => `${pfx(lang)}/${f}/${s}/`;
export const watchPath = (lang, id) => `${pfx(lang)}/${id}/`;

export const inLang = (site, lang) => site.videos.filter((v) => v.langs[lang]);
export const fieldText = (f, lang) => f.text[lang] ?? f.text.en;
export const fieldIds = (site) => Object.values(site.fields).sort((a, b) => a.order - b.order).map((f) => f.id);
export const subsOf = (site, lang, f) => [...new Set(inLang(site, lang).filter((v) => v.field === f).map((v) => v.sub))];
export const hasSubPages = (site, lang, f) => subsOf(site, lang, f).length > 1;
export const poster = (v, lang) => `/${v.langs[lang].poster}`;
