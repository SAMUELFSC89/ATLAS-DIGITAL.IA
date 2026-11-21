import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import HomeShell from './HomeShell';
import '../index.css';

// Entrada própria da página inicial ("/"): carrega só a home, sem o app completo.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HomeShell />
  </StrictMode>,
);
