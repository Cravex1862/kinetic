import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './pages/AppRouter';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
