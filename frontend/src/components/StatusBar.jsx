import React from 'react';

export default function StatusBar({ status }) {
  return (
    <div className="status-bar border-top mt-3 pt-2" aria-live="polite">
      {status}
    </div>
  );
}
