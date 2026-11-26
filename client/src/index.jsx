// Styles first, so the theme overrides Bootstrap and the date picker.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import './styles/theme.scss';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { AuthProvider } from './services/auth.jsx';
import { ToastProvider } from './services/toast.jsx';
import { CheckInProvider } from './services/CheckInProvider.jsx';
import { CheckOutProvider } from './services/CheckOutProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <React.StrictMode>
            <AuthProvider>
                <ToastProvider>
                    <CheckInProvider>
                        <CheckOutProvider>
                            <App />
                        </CheckOutProvider>
                    </CheckInProvider>
                </ToastProvider>
            </AuthProvider>
        </React.StrictMode>
    </BrowserRouter>
);
