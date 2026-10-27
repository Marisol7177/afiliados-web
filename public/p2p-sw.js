const CACHE = "coinfactory-p2p-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname === "/p2p-manifest.json" || url.pathname === "/p2p-sw.js") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request.url);
    if (cached && cached.headers.get("X-Coinfactory-P2P") === "verified") {
      return cached;
    }

    try {
      const response = await fetch(request);
      return response;
    } catch {
      if (cached) return cached;
      return new Response("Recurso no disponible en red ni en caché P2P", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      });
    }
  })());
});
