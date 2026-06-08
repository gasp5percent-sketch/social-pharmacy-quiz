const CACHE_NAME = 'social-pharmacy-pwa-v4-figures-complete';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './questions.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './figures/q10_medical_insurance_system.png',
  './figures/q10_national_medical_expense_charts.png',
  './figures/q11_clinical_trial_org.png',
  './figures/q11_priority_review_text.png',
  './figures/q7_drug_harm_table.png',
  './figures/q9_insurance_table_1.png',
  './figures/q9_insurance_table_2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      if (key !== CACHE_NAME) return caches.delete(key);
    })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
