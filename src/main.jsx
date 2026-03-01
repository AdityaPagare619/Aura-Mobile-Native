import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { dbService } from './db/local_store.js'
import { aiEngine } from './plugins/loader.js'

// Expose React to the window specifically for the dynamic AI `new Function` eval loader
window.React = React;

const Root = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initSystem() {
      await dbService.init();
      await aiEngine.initPluginDirectory();
      setIsReady(true);
    }
    initSystem();
  }, []);

  if (!isReady) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Initializing Aura Local Nexus...</div>;

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
