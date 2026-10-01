// page text per language (one entry per language in LANG_NAMES; missing languages fall back to English)
export const TEXT = {
  en: {
    home: 'Knowledge Videos',
    homeTitle: 'Knowledge Videos · Short animated explainers',
    homeH1: 'Knowledge Videos: short animated explainers',
    homeDesc: (names) => `Short animated explainers on ${names}, organised by subject. Each video comes with a full transcript.`,
    fieldTitle: (t) => `${t}: animated explainer videos`,
    explainer: 'animated explainer',
    watchDesc: (len) => `Watch the ${len} animated explainer, with a full transcript.`,
    transcript: 'Transcript', related: 'More in this series', count: (n) => `${n} video${n > 1 ? 's' : ''}`,
    locale: 'en_US',
  },
  vi: {
    home: 'Knowledge Videos',
    homeTitle: 'Knowledge Videos · Video hoạt hình giải thích kiến thức',
    homeH1: 'Knowledge Videos: video hoạt hình giải thích kiến thức',
    homeDesc: (names) => `Video hoạt hình ngắn giải thích kiến thức về ${names}, sắp xếp theo môn học. Mỗi video có lời thuyết minh đầy đủ.`,
    fieldTitle: (t) => `${t}: video hoạt hình giải thích`,
    explainer: 'video hoạt hình giải thích',
    watchDesc: (len) => `Xem video ${len} kèm lời thuyết minh đầy đủ.`,
    transcript: 'Lời thuyết minh', related: 'Cùng chuỗi bài', count: (n) => `${n} video`,
    locale: 'vi_VN',
  },
};
export const T = (lang) => TEXT[lang] ?? TEXT.en;
export const list = (lang, items) => new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items);
