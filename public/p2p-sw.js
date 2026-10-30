const CACHE = "coinfactory-p2p-v2";
const P2P_TIMEOUT_MS = 3000;

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

async function requestFromPeers(path) {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  });

  if (!clients.length) return false;

  for (const client of clients) {
    const channel = new MessageChannel();

    const result = await new Promise(resolve => {
      let finished = false;

      const finish = value => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        channel.port1.close();
        resolve(value);
      };

      const timer = setTimeout(() => finish(false), P2P_TIMEOUT_MS);

      channel.port1.onmessage = event => {
        finish(event.data?.type === "P2P_READY");
      };

      client.postMessage(
        { type: "P2P_FETCH", path },
        [channel.port2]
      );
    });

    if (result) return true;
  }

  return false;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname === "/p2p-manifest.json" ||
    url.pathname === "/p2p-sw.js"
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    const cached = await cache.match(request.url);
    if (cached?.headers.get("X-Coinfactory-P2P") === "verified") {
      return cached;
    }

    // Intenta P2P primero; si falla o tarda, conserva el HTTP normal.
    const p2pPath =
      url.pathname === "/"
        ? "/index.html"
        : url.pathname === "/lab" || url.pathname === "/lab/"
          ? "/lab.html"
          : url.pathname;

    await requestFromPeers(p2pPath).catch(() => false);

    const p2pCopy = await cache.match(
      new URL(p2pPath, self.location.origin).href
    );
    if (p2pCopy?.headers.get("X-Coinfactory-P2P") === "verified") {
      return p2pCopy;
    }

    try {
      return await fetch(request);
    } catch {
      return new Response(
        "Recurso no disponible por HTTP ni en la caché P2P",
        {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        }
      );
    }
  })());
});
