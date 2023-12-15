import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';


import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
    apiKey: "AIzaSyCojbWKfqoB_wex_JNAkt-P8bByciA3HF0",
    authDomain: "audio-recorder-app-fzxa7d.firebaseapp.com",
    projectId: "audio-recorder-app-fzxa7d",
    storageBucket: "audio-recorder-app-fzxa7d.appspot.com",
    messagingSenderId: "164924807497",
    appId: "1:164924807497:web:c71305b1306354314ce298",
    measurementId: "G-2JKM00EWN8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
