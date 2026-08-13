import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Dois Service Workers convivem aqui, cada um com seu escopo:
//   /sw.js         → PDV offline, registrado abaixo
//   /portal-sw.js  → PWA do Portal da revendedora, registrado em usePortalPWA
//
// A limpeza antes removia TODOS os registros fora do /pdv, incluindo o do
// Portal. Como o Portal registra o dele depois da montagem do React e esta
// limpeza roda no evento `load`, quem ganhava a corrida variava: a instalação
// e o modo offline do Portal funcionavam de forma intermitente, sem erro e sem
// jeito de reproduzir. Agora só removemos registros que não pertencem a nenhum
// dos dois escopos conhecidos.
const SW_CONHECIDOS = ['/sw.js', '/portal-sw.js'];

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
    }

    // Remove apenas workers órfãos (versões antigas), preservando os atuais.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        const script = registration.active?.scriptURL
          || registration.installing?.scriptURL
          || registration.waiting?.scriptURL
          || '';
        const conhecido = SW_CONHECIDOS.some((path) => script.endsWith(path));
        if (!conhecido) registration.unregister();
      }
    });
  });
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
