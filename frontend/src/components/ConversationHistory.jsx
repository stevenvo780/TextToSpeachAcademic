import React, { useState, useEffect } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Modal from 'react-bootstrap/Modal';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { BsTrash, BsClock, BsPencil, BsSearch, BsX } from 'react-icons/bs';

export default function ConversationHistory({ show, onHide, onLoadConversation }) {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');

  // Cargar conversaciones del localStorage al montar el componente
  useEffect(() => {
    loadConversations();
  }, []);

  // Filtrar conversaciones cuando cambie la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv => 
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  const loadConversations = () => {
    const stored = localStorage.getItem('conversation_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const sorted = parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setConversations(sorted);
        setFilteredConversations(sorted);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setConversations([]);
        setFilteredConversations([]);
      }
    } else {
      setConversations([]);
      setFilteredConversations([]);
    }
  };

  const deleteConversation = (id) => {
    const filtered = conversations.filter(conv => conv.id !== id);
    setConversations(filtered);
    setFilteredConversations(filtered.filter(conv => 
      !searchQuery.trim() || 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    localStorage.setItem('conversation_history', JSON.stringify(filtered));
  };

  const clearAllConversations = () => {
    setConversations([]);
    setFilteredConversations([]);
    setSearchQuery('');
    localStorage.removeItem('conversation_history');
  };

  const editConversation = (conversation) => {
    setEditingConversation(conversation);
    setEditTitle(conversation.title || '');
    setEditText(conversation.text || '');
    setShowEditModal(true);
  };

  const saveEditedConversation = () => {
    if (!editingConversation) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === editingConversation.id) {
        return {
          ...conv,
          title: editTitle.trim() || 'Sin título',
          text: editText,
          preview: editText.substring(0, 150),
          timestamp: new Date().toISOString() // Actualizar timestamp
        };
      }
      return conv;
    });

    const sorted = updatedConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setConversations(sorted);
    localStorage.setItem('conversation_history', JSON.stringify(sorted));
    setShowEditModal(false);
    setEditingConversation(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
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
        {/* Barra de búsqueda */}
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <BsSearch size={14} />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <Button variant="outline-secondary" onClick={clearSearch}>
              <BsX size={16} />
            </Button>
          )}
        </InputGroup>

        {filteredConversations.length === 0 ? (
          <div className="text-center text-muted p-4">
            <BsClock size={48} className="mb-3 opacity-25" />
            <h6>
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones guardadas'}
            </h6>
            <p className="small mb-0">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda'
                : 'Las conversaciones se guardarán automáticamente cuando uses el lector'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">
                {filteredConversations.length} de {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
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
              {filteredConversations.map((conversation) => (
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
                    <div className="d-flex align-items-center gap-1">
                      <Badge bg="primary" className="small">
                        {conversation.paragraphs?.length || 0} párrafos
                      </Badge>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="p-1 border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          editConversation(conversation);
                        }}
                        style={{ width: '24px', height: '24px' }}
                        title="Editar conversación"
                      >
                        <BsPencil size={10} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="p-1 border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        style={{ width: '24px', height: '24px' }}
                        title="Eliminar conversación"
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

      {/* Modal de edición */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <BsPencil className="me-2" />
            Editar Conversación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ingresa un título para la conversación"
                maxLength={100}
              />
              <Form.Text className="text-muted">
                {editTitle.length}/100 caracteres
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contenido</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Contenido de la conversación"
                style={{ resize: 'vertical' }}
              />
              <Form.Text className="text-muted">
                {editText.length} caracteres
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={saveEditedConversation}
            disabled={!editText.trim()}
          >
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </Offcanvas>
  );
}
