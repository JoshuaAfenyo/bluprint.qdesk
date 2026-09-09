// Bump this string every time you push updated prices or files.
// A new CACHE name is what tells the service worker "there's a new version".
const CACHE = "qdesk-bluprint-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./config.json",
  "./icon.svg",
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

// Fetch: try the network first (so rates are always current when online),
// and cache each fresh response as we go. Only fall back to the cached
// copy if the network request fails (offline / no connection).
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Let the page tell a waiting worker "go ahead, activate now" --
// triggered by the person clicking the "Refresh for new prices" banner.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
