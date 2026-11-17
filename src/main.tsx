import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

import App from './App.tsx';

// Vite's BASE_URL is "/" or "/<repo>/"; the router wants it without the trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
