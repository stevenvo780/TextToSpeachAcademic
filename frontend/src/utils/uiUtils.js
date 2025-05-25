// uiUtils.js - Utilidades de UI para React

// Esta función está obsoleta, usar el sistema de notificaciones en su lugar
export function showError(msg) {
  console.warn('showError está obsoleta, usa el sistema de notificaciones');
  console.error(msg);
}

export function updateStatus(setStatus, message) {
  setStatus(message);
}

// Utilidades para trabajar con localStorage de forma segura
export function getLocalStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
    return false;
  }
}
