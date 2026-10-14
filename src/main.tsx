import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { FirebaseDataProvider } from './providers/FirebaseDataProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FirebaseDataProvider>
      <App />
    </FirebaseDataProvider>
  </React.StrictMode>
);
