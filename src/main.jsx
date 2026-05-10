import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/accessibility.css'
import { GameProvider } from './context/GameContext.jsx'
import { registerServiceWorker } from './services/PWAService.js'

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
