// uiUtils.js - Utilidades de UI para React

export function showError(msg) {
  // Puedes usar un sistema de notificaciones tipo toast en React
  alert(msg);
}

export function updateStatus(setStatus, message) {
  setStatus(message);
}
