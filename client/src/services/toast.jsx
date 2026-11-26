import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const ToastContext = createContext(null);

const ICONS = { success: faCircleCheck, danger: faCircleExclamation, info: faCircleInfo };

/** Small, non-blocking notifications that replace window.alert(). */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback((variant, message) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((current) => [...current, { id, variant, message }]);
    }, []);

    const api = useMemo(() => ({
        success: (message) => push('success', message),
        error: (message) => push('danger', message),
        info: (message) => push('info', message),
    }), [push]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastContainer position="top-end" containerPosition="fixed" className="p-3 app-toasts">
                {toasts.map((toast) => (
                    <Toast key={toast.id} onClose={() => remove(toast.id)} delay={4000} autohide
                           className={`app-toast app-toast-${toast.variant}`}>
                        <Toast.Body className="d-flex align-items-start gap-2">
                            <FontAwesomeIcon icon={ICONS[toast.variant]} className="app-toast-icon" />
                            <span className="flex-grow-1">{toast.message}</span>
                            <button type="button" className="btn-close" aria-label="Close"
                                    style={{ fontSize: '0.65rem' }} onClick={() => remove(toast.id)} />
                        </Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a <ToastProvider>');
    }
    return context;
};
