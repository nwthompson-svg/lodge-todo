// Lodge to-do — service worker (network-first so updates show immediately when online,
// cache fallback so the app still opens on patchy site signal).
const C = "lodge-todo-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;                 // never touch bridge POSTs
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;             // don't cache cross-origin (bridge)
  e.respondWith(
    fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(C).then(c => c.put(e.request, copy));
      return resp;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
