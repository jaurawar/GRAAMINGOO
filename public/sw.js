// Graamin Go Service Worker
// Offline-first PWA for rural India — low connectivity environments
// This is existential: "The platform cannot require live internet for every booking"

const CACHE_NAME = "gramingo-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/book",
  "/offline.html",
  "/manifest.json",
];

// API routes to cache responses for (offline fallback)
const API_CACHE_NAME = "gramingo-api-v1";
const CACHEABLE_APIS = [
  "/api/pricing",
];

// ─── Install: pre-cache shell ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Offline request queue ────────────────────────────────────────────────────
// When a POST to /api/rides fails (no connectivity), queue it in IndexedDB
// and replay when back online.

const QUEUE_DB_NAME = "gramingo-offline-queue";
const QUEUE_STORE = "requests";

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

async function queueRequest(request) {
  const db = await openQueueDB();
  const body = await request.clone().text();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).add({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    });
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

async function replayQueue() {
  const db = await openQueueDB();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  const store = tx.objectStore(QUEUE_STORE);
  const all = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result);
  });

  for (const item of all) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      store.delete(item.id);
    } catch {
      // Still offline — leave in queue
    }
  }
}

// ─── Fetch handler ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls — fall back to cache, then offline queue
  if (url.pathname.startsWith("/api/")) {
    // Cache GET API responses (pricing, driver lists) for offline access
    if (request.method === "GET" && CACHEABLE_APIS.some((p) => url.pathname.startsWith(p))) {
      event.respondWith(
        fetch(request)
          .then((res) => {
            const clone = res.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          })
          .catch(async () => {
            const cached = await caches.match(request);
            return cached ?? new Response(JSON.stringify({ error: "offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          })
      );
      return;
    }

    // POST /api/rides — queue for replay when offline
    if (request.method === "POST" && url.pathname === "/api/rides") {
      event.respondWith(
        fetch(request).catch(async () => {
          await queueRequest(request);
          return new Response(
            JSON.stringify({
              queued: true,
              message: "No internet — ride request saved. Will submit when connected.",
            }),
            { status: 202, headers: { "Content-Type": "application/json" } }
          );
        })
      );
      return;
    }
    return; // All other API calls: pass through
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(
      (cached) => cached ?? fetch(request).catch(() => caches.match(OFFLINE_URL))
    )
  );
});

// ─── Background sync — replay queue when back online ─────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "replay-queue") {
    event.waitUntil(replayQueue());
  }
});

// ─── Online event relay ───────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "REPLAY_QUEUE") {
    replayQueue();
  }
});
