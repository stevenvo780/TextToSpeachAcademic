import { useState } from 'react';

// Hook personalizado para notificaciones
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'error', duration = 5000) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      show: true
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showError = (message) => showNotification(message, 'error');
  const showSuccess = (message) => showNotification(message, 'success');
  const showWarning = (message) => showNotification(message, 'warning');
  const showInfo = (message) => showNotification(message, 'info');

  return {
    notifications,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeNotification
  };
}
