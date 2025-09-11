import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TelemetryProvider } from './components/TelemetryContext'; // ajusta el path según dónde lo pongas


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <TelemetryProvider>
    <App />
  </TelemetryProvider>
);
