import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PlantProvider } from './context/PlantContext';
import { FirebaseProvider } from './context/FirebaseContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <FirebaseProvider>
    <PlantProvider>
      <App />
    </PlantProvider>
  </FirebaseProvider>
);


