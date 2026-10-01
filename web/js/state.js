import { store } from './store.js';

// mutable app state shared by every module (lang is set from the URL in main.js)
export const state = {
  field: 'all', series: 'all', query: '', lang: 'en',
  current: null, // the video open in the player
  watched: store.get(),
};
