import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(id => setToasts(prev => prev.filter(toast => toast.id !== id)), []);

  /** variant: 'success' | 'danger' | 'warning' | 'info' */
  const showToast = useCallback((message, variant = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-2), { id, message, variant }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="bottom-end" className="p-3 app-toasts">
        {toasts.map(toast => (
          <Toast key={toast.id} bg={toast.variant} onClose={() => dismiss(toast.id)} delay={3500} autohide>
            <Toast.Body className={toast.variant === 'warning' ? 'text-dark' : 'text-white'}>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
