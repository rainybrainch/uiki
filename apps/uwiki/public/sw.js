const CACHE = "uwiki-v1"
const OFFLINE_URL = "/"

// インストール: 基本リソースをキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(["/", "/tasks", "/habits", "/diary", "/library", "/calendar"])
    )
  )
  self.skipWaiting()
})

// アクティベート: 古いキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// フェッチ: Network First（オンライン優先、失敗時にキャッシュ）
self.addEventListener("fetch", (e) => {
  // API リクエストはキャッシュしない
  if (e.request.url.includes("/api/")) return

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 成功したらキャッシュを更新
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() =>
        // オフライン時はキャッシュから返す
        caches.match(e.request).then((cached) => cached ?? caches.match(OFFLINE_URL))
      )
  )
})
