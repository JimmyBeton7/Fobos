import React from 'react'
import ReactDOM from 'react-dom/client'
import 'chart.js/auto';
import App from './App'
import 'primereact/resources/themes/mdc-dark-indigo/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import { Capacitor } from '@capacitor/core';

async function bootstrap() {
  try {
    if (Capacitor.isNativePlatform()) {
    }
  } catch (err) {
    console.error('Failed to init mobile DB', err);
  }

  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element #root not found');
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();


/*
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
*/

