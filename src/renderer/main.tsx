import { StrictMode } from 'react'; // imports react strict mode wrapper for dev mode code warnings
import { createRoot } from 'react-dom/client'; // imports react root mounting engine to insert components into HTML DOM
import AppRouter from './pages/AppRouter'; // imports navigation routing system coponent 
import './index.css'; // imports the global CSS styles including Tailwind

const container = document.getElementById('root'); // select the target HTML file with the ID 'root'
if (!container) { // if root container is missing
  throw new Error('Root element not found'); // crash with an error
}

createRoot(container).render( // if root exists
  <StrictMode> {/* // turns on strict react checks to warn us abt unsafe code in console */}
    <AppRouter /> {/*// render our main routing navigation manager*/}
  </StrictMode>,
);
