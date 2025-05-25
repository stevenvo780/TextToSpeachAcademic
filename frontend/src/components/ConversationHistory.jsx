import React, { useState, useEffect } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { BsTrash, BsClock } from 'react-icons/bs';

export default function ConversationHistory({ show, onHide, onLoadConversation }) {
  const [conversations, setConversations] = useState([]);

  // Cargar conversaciones del localStorage al montar el componente
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const stored = localStorage.getItem('conversation_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (err) {
        console.error('Error loading conversations:', err);
        setConversations([]);
      }
    }
  };

  const deleteConversation = (id) => {
    const filtered = conversations.filter(conv => conv.id !== id);
    setConversations(filtered);
    localStorage.setItem('conversation_history', JSON.stringify(filtered));
  };

  const clearAllConversations = () => {
    setConversations([]);
    localStorage.removeItem('conversation_history');
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: '400px' }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <BsClock className="me-2" />
          Historial de Conversaciones
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {conversations.length === 0 ? (
          <div className="text-center text-muted p-4">
            <BsClock size={48} className="mb-3 opacity-25" />
            <h6>No hay conversaciones guardadas</h6>
            <p className="small mb-0">
              Las conversaciones se guardarán automáticamente cuando uses el lector
            </p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">
                {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
              </span>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={clearAllConversations}
                className="d-flex align-items-center"
              >
                <BsTrash className="me-1" size={12} />
                Limpiar todo
              </Button>
            </div>
            
            <ListGroup variant="flush">
              {conversations.map((conversation) => (
                <ListGroup.Item
                  key={conversation.id}
                  action
                  onClick={() => onLoadConversation(conversation)}
                  className="conversation-item px-0 border-start-0 border-end-0"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <small className="text-muted">
                      {formatDate(conversation.timestamp)}
                    </small>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="primary" className="small">
                        {conversation.paragraphs?.length || 0} párrafos
                      </Badge>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="p-1 border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        style={{ width: '24px', height: '24px' }}
                      >
                        <BsTrash size={10} />
                      </Button>
                    </div>
                  </div>
                  <div className="conversation-preview">
                    <h6 className="mb-1 fw-normal">
                      {conversation.title || 'Sin título'}
                    </h6>
                    <p className="mb-0 small text-muted">
                      {truncateText(conversation.preview || conversation.text || 'Sin contenido')}
                    </p>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
