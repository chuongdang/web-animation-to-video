// "watched" marks live in localStorage; the site works without them
export const store = {
  get() { try { return new Set(JSON.parse(localStorage.getItem('kv-watched') ?? '[]')); } catch { return new Set(); } },
  add(id) { try { const s = store.get(); s.add(id); localStorage.setItem('kv-watched', JSON.stringify([...s])); } catch { /* ignore */ } },
};
