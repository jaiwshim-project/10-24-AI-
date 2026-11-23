const version = 'rolecoach-mobile-v42';
const shell = ['./', './index.html', './mobile.css', './mobile.js', './member-account.bundle.js', './interview-overview.js', './feedback-history.js', './feedback-example.json', './counseling-examples.json', './manifest.webmanifest', './favicon.png', './brand-icon-192.png', './brand-icon-512.png', './interview-hero.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(version).then(cache => cache.addAll(shell)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('rolecoach-mobile-') && key !== version)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !shell.some(path => new URL(path, self.registration.scope).href === url.href)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
