import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { PyLearnProvider } from './context/PyLearnContext';
import { SnackbarProvider } from './context/SnackbarContext';
import Snackbar from './components/Snackbar';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SnackbarProvider>
      <PyLearnProvider>
        <App />
        <Snackbar />
      </PyLearnProvider>
    </SnackbarProvider>
  </React.StrictMode>
);
