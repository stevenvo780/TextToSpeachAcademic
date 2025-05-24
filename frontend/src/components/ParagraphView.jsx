import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';

export default function ParagraphView({ parts, activeIdx, onSelect }) {
  if (!parts || parts.length === 0) {
    return (
      <div className="text-center text-muted p-5">
        <i className="bi bi-file-text display-1 mb-3"></i>
        <h5>No hay párrafos para mostrar</h5>
        <p className="mb-0">Usa el editor para escribir texto y luego presiona "Dividir en párrafos y leer"</p>
      </div>
    );
  }

  return (
    <div className="paragraph-view-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <ListGroup variant="flush">
        {parts.map((paragraph, idx) => (
          <ListGroup.Item
            key={idx}
            action
            active={idx === activeIdx}
            onClick={() => onSelect(idx)}
            className={`paragraph-item ${idx === activeIdx ? 'active-paragraph' : ''}`}
            style={{
              cursor: 'pointer',
              borderLeft: idx === activeIdx ? '4px solid #0d6efd' : 'none',
              paddingLeft: idx === activeIdx ? '12px' : '16px'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="paragraph-text flex-grow-1 me-2">
                {paragraph}
              </div>
              <small className="text-muted badge bg-secondary">
                {idx + 1}
              </small>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
