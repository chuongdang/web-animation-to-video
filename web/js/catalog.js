import { state } from './state.js';

export const { fields, videos: allVideos, languages, pages } = window.SITE;
export const codes = languages.map((l) => l.code);
export const fieldById = Object.fromEntries(fields.map((f) => [f.id, f]));

// old links used field/name (before sub-category folders; g9 scenes had a g9- prefix)
export const findVideo = (id) => allVideos.find((x) => x.id === id) ?? allVideos.find((x) => [`${x.field}/${x.name}`, `${x.field}/g9-${x.name}`].includes(id));

// A video is listed in a language only if it has been rendered in it.
export const videos = () => allVideos.filter((v) => v.langs[state.lang]);
export const tx = (v) => v.langs[state.lang];
export const fieldText = (f) => f.text[state.lang] ?? f.text.en;
export const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
