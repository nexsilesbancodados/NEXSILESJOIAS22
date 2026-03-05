import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker only for PDV (offline) support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isPDV = window.location.pathname.startsWith('/pdv');
    if (isPDV) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
          registration.update();
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    } else {
      // Unregister SW on non-PDV pages to prevent interference
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  });
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
