export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/javascript')
  return `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.registration.unregister());`
})
