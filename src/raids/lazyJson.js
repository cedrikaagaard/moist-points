// Raid data files (nights, bosses, players, replays, analyses) ship as plain
// static files and are fetched when a page needs one. Importing them as
// modules made Vite parse every one of them at build time (hundreds of files,
// tens of MB), which ran Netlify's build out of memory.
//   const files = lazyJson(import.meta.glob("./data/x/*.json", { query: "?url", import: "default", eager: true }));
//   files["./data/x/a.json"]?.().then(...)
export function lazyJson(urls) {
  const cache = new Map();
  return Object.fromEntries(
    Object.entries(urls).map(([path, url]) => [
      path,
      () => {
        if (!cache.has(path)) cache.set(path, fetch(url).then((r) => r.json()));
        return cache.get(path);
      },
    ])
  );
}
