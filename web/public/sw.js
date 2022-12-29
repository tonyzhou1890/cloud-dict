const cacheName = 'cloud-dict';
const staticAssets = [];
self.addEventListener('install', async e => {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', e => {
  self.clients.claim();
});
self.addEventListener('fetch', async e => {
  if (e.request.destination === 'image' && e.request.url.includes('?dictId=')) {
    // let path = e.request.url.replace(/http(s):\/\/(^\/*)\//, '')
    const url = new URL(e.request.url)
    const dictId = url.searchParams.get('dictId')
    const baseURL = url.hostname === 'localhost' ? 'http://localhost:8500' : '/api'
    e.respondWith(fetch(`${baseURL}/dict/image?file=${url.pathname}&dictId=${dictId}`))
  }
});