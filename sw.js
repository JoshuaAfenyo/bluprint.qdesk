// Bump this string every time you push updated prices or files.
// A new CACHE name is what tells the service worker "there's a new version".
const CACHE = "qdesk-bluprint-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./config.json",
  "./manifest.json",
  "./icon.svg",
  "./icon-180.png",
  "./logo.jpg"
];

// Install: download and cache the current file set.
// Deliberately does NOT call skipWaiting() -- the new worker
// stays in "waiting" state until the page tells it to take over.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate: clean out old cache versions once this worker takes control.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      )
    )
  );
});

// Fetch:
// - config.json is network-first, cache as fallback. Prices should reach
//   an already-installed app on the next online load, without waiting on
//   a CACHE version bump. The fresh response is stashed in the cache so
//   offline use still shows the last-known prices.
// - everything else stays cache-first (works offline, fast to load).
self.addEventListener("fetch", (event) => {
  if (event.request.url.endsWith("/config.json")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Let the page tell a waiting worker "go ahead, activate now" --
// triggered by the person clicking the "Refresh for new prices" banner.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
