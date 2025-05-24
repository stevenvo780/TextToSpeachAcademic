import React from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function Controls({
  onPlay, onPause, onResume, onCancel, onPrev, onNext, onExport,
  canPlay, canPause, canResume, canPrev, canNext, canExport
}) {
  return (
    <div className="d-flex flex-column gap-2">
      {/* Botón principal de reproducir */}
      <Button 
        variant="primary" 
        size="lg"
        className="w-100" 
        onClick={onPlay} 
        disabled={!canPlay}
      >
        <i className="bi bi-play-fill me-2"></i>
        Reproducir
      </Button>
      
      {/* Controles de pausa/resume/cancel */}
      <Row className="g-2">
        <Col>
          <Button 
            variant="warning" 
            size="sm"
            className="w-100" 
            onClick={onPause} 
            disabled={!canPause}
          >
            <i className="bi bi-pause-fill me-1"></i>
            Pausar
          </Button>
        </Col>
        <Col>
          <Button 
            variant="success" 
            size="sm"
            className="w-100" 
            onClick={onResume} 
            disabled={!canResume}
          >
            <i className="bi bi-play-fill me-1"></i>
            Reanudar
          </Button>
        </Col>
        <Col>
          <Button 
            variant="danger" 
            size="sm"
            className="w-100" 
            onClick={onCancel}
          >
            <i className="bi bi-x-circle me-1"></i>
            Cancelar
          </Button>
        </Col>
      </Row>
      
      {/* Controles de navegación */}
      <Row className="g-2">
        <Col>
          <Button 
            variant="outline-primary" 
            size="sm"
            className="w-100" 
            onClick={onPrev} 
            disabled={!canPrev}
          >
            <i className="bi bi-skip-start-fill me-1"></i>
            Anterior
          </Button>
        </Col>
        <Col>
          <Button 
            variant="outline-primary" 
            size="sm"
            className="w-100" 
            onClick={onNext} 
            disabled={!canNext}
          >
            <i className="bi bi-skip-end-fill me-1"></i>
            Siguiente
          </Button>
        </Col>
      </Row>
      
      {/* Botón de exportar */}
      <Button 
        variant="outline-success" 
        className="w-100 mt-2" 
        onClick={onExport} 
        disabled={!canExport}
      >
        <i className="bi bi-download me-2"></i>
        Exportar Audio MP3
      </Button>
    </div>
  );
}
