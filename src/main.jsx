import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/accessibility.css'
import { GameProvider } from './context/GameContext.jsx'
import { registerServiceWorker } from './services/PWAService.js'

// AKITA-317: one-shot rebrand storage migration (elifoot_* → olefut_*).
// Idempotent via __olefut_migrated_v1 sentinel. Preserva saves de usuários
// existentes pós-rename do projeto.
if (typeof window !== 'undefined' && window.localStorage) {
    try {
        if (!localStorage.getItem('__olefut_migrated_v1')) {
            const oldKeys = Object.keys(localStorage).filter(k => k.startsWith('elifoot_'));
            oldKeys.forEach(k => {
                const newKey = 'olefut_' + k.slice('elifoot_'.length);
                if (!localStorage.getItem(newKey)) {
                    localStorage.setItem(newKey, localStorage.getItem(k));
                }
            });
            localStorage.setItem('__olefut_migrated_v1', '1');
        }
    } catch (_e) { /* localStorage indisponível, ignora */ }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)

// §15.4: Register PWA service worker (async, non-blocking)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerServiceWorker();
}
