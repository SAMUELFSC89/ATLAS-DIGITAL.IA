import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdsLandingPage, {ADS_LANDING_PATH} from './components/AdsLandingPage.tsx';
import {initAdsTracking} from './lib/adsTracking.ts';
import './index.css';

initAdsTracking();

// Página de destino dos anúncios, servida em endereço próprio.
const path = window.location.pathname.replace(/\/+$/, '');
const isAdsLanding = path === ADS_LANDING_PATH;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdsLanding ? <AdsLandingPage /> : <App />}
  </StrictMode>,
);
