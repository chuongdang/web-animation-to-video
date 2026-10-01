import { el } from './dom.js';
import { state } from './state.js';

export const UI = {
  en: {
    tagline: 'Short animated explainers, organised by subject.', search: 'Search videos, topics, tags…', searchLabel: 'Search videos',
    all: 'All subjects', allSub: 'All', watched: 'Watched', none: 'No videos match your search.',
    share: 'Copy link', copied: 'Link copied', transcript: 'Transcript', prev: '← Previous in series', next: 'Next in series →', close: 'Close video',
    stats: (n, total, subjects, time) => `${n} of ${total} videos · ${subjects} subjects · ${time} total`,
    count: (n) => `${n} video${n > 1 ? 's' : ''}`,
  },
  vi: {
    tagline: 'Những video hoạt hình ngắn giải thích kiến thức, sắp xếp theo môn học.', search: 'Tìm video, chủ đề, thẻ…', searchLabel: 'Tìm video',
    all: 'Tất cả môn học', allSub: 'Tất cả', watched: 'Đã xem', none: 'Không có video nào phù hợp.',
    share: 'Sao chép liên kết', copied: 'Đã sao chép', transcript: 'Lời thuyết minh', prev: '← Bài trước', next: 'Bài tiếp theo →', close: 'Đóng video',
    stats: (n, total, subjects, time) => `${n} / ${total} video · ${subjects} môn học · tổng ${time}`,
    count: (n) => `${n} video`,
  },
};
export const ui = () => UI[state.lang] ?? UI.en;

// inline SVG flags (emoji flags don't render on Windows); unknown languages fall back to the code
export const FLAGS = {
  en: '<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="13"/><path d="M30 0V40M0 20H60" stroke="#c8102e" stroke-width="7"/></svg>',
  vi: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#da251d"/><polygon fill="#ff0" points="15.00,4.00 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15.00,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15"/></svg>',
};
export const flag = (code) => el('span', { class: 'flag', 'aria-hidden': 'true', innerHTML: FLAGS[code] ?? '' });
