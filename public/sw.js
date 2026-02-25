// Self-destructing service worker.
// This replaces the old manual SW so browsers that still have it
// registered will pick up this "no-op" version and unregister themselves.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister();
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => client.navigate(client.url));
  });
});
