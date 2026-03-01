import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker with forced cache cleanup
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Force cleanup of old caches on every load
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => name !== 'nexsile-pdv-v2');
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      if (oldCaches.length > 0) {
        console.log('[Cache] Cleaned old caches:', oldCaches);
      }
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
        // Force update check
        registration.update();
        // If there's a waiting worker, activate it immediately
        if (registration.waiting) {
          registration.waiting.postMessage('skipWaiting');
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[SW] New version activated, reloading...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Force fresh React instance
const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
