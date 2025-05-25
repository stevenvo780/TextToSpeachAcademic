import React from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

// Componente de notificaciones
export function NotificationContainer({ notifications, onRemove }) {
  const getVariant = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'error':
      default: return 'danger';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      case 'error':
      default: return 'bi-x-circle-fill';
    }
  };

  return (
    <ToastContainer 
      position="top-end" 
      className="p-3"
      style={{ 
        position: 'fixed', 
        top: '80px',  // Debajo de la navbar
        right: '20px',
        zIndex: 1060 
      }}
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          show={notification.show}
          onClose={() => onRemove(notification.id)}
          bg={getVariant(notification.type)}
          autohide
          delay={5000}
        >
          <Toast.Header>
            <i className={`bi ${getIcon(notification.type)} me-2`}></i>
            <strong className="me-auto">
              {notification.type === 'error' ? 'Error' :
               notification.type === 'success' ? 'Éxito' :
               notification.type === 'warning' ? 'Advertencia' : 'Información'}
            </strong>
          </Toast.Header>
          <Toast.Body className={notification.type === 'error' ? 'text-white' : ''}>
            {notification.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
