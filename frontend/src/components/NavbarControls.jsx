import React, { useRef } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { 
  BsPlay, 
  BsPause, 
  BsSkipStart, 
  BsSkipEnd, 
  BsDownload,
  BsClock,
  BsSpeedometer2,
  BsFileEarmarkText,
  BsPencil,
  BsFilePdf,
  BsPlus
} from 'react-icons/bs';

export default function NavbarControls({
  mode,
  speed,
  isPlaying,
  isPaused,
  activeIdx,
  paragraphs,
  audios,
  onPlay,
  onPause,
  onResume,
  onPrev,
  onNext,
  onExport,
  onSpeedChange,
  onToggleMode,
  onShowHistory,
  onPdfUpload,
  onNewConversation
}) {
  const fileInputRef = useRef(null);
  
  const handlePdfClick = () => {
    fileInputRef.current?.click();
  };
  const canPrev = activeIdx > 0 && isPlaying;
  const canNext = activeIdx < paragraphs.length - 1 && isPlaying;
  const canExport = audios.length > 0;

  // Función para manejar el botón de play/pause combinado
  const handlePlayPause = () => {
    if (!isPlaying) {
      onPlay();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const renderTooltipButton = (icon, onClick, disabled, variant, tooltip, size = 18) => (
    <OverlayTrigger
      placement="bottom"
      overlay={<Tooltip id={`tooltip-${tooltip.replace(' ', '-')}`}>{tooltip}</Tooltip>}
    >
      <Button
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="me-1 me-md-2 d-flex align-items-center justify-content-center"
        style={{ 
          width: '36px', 
          height: '36px',
          borderRadius: '8px'
        }}
      >
        {React.cloneElement(icon, { size })}
      </Button>
    </OverlayTrigger>
  );

  return (
    <Navbar bg="dark" variant="dark" expand="xl" className="mb-0" fixed="top">
      <Container fluid>
        <Navbar.Brand className="d-flex align-items-center">
          <BsFileEarmarkText className="me-2" size={24} />
          Lector de Textos IA
        </Navbar.Brand>
        
        <Nav className="ms-auto d-flex align-items-center flex-row flex-wrap">
          {/* Control de velocidad */}
          <div className="d-flex align-items-center me-2 me-md-3">
            <BsSpeedometer2 className="text-light me-1 me-md-2" size={16} />
            <Form.Select
              value={speed}
              onChange={(e) => onSpeedChange(e.target.value)}
              size="sm"
              style={{ width: '70px' }}
              className="bg-dark text-light border-secondary"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
            </Form.Select>
          </div>

          {/* Controles de reproducción */}
          <div className="d-flex align-items-center me-2 me-md-3 flex-wrap">
            {/* Botón de reproducir/pausar combinado */}
            {renderTooltipButton(
              isPlaying && !isPaused ? <BsPause /> : <BsPlay />,
              handlePlayPause,
              false,
              isPlaying && !isPaused ? "warning" : "success",
              isPlaying && !isPaused ? "Pausar" : 
                (paragraphs.length > 0 && mode === 'lector' ? 'Reproducir' : 'Dividir y Reproducir')
            )}

            {/* Separador */}
            <div className="vr text-secondary me-1 me-md-2 d-none d-sm-block" style={{ height: '30px' }}></div>

            {/* Botón anterior */}
            {renderTooltipButton(
              <BsSkipStart />,
              onPrev,
              !canPrev,
              "outline-primary",
              "Párrafo anterior"
            )}

            {/* Botón siguiente */}
            {renderTooltipButton(
              <BsSkipEnd />,
              onNext,
              !canNext,
              "outline-primary",
              "Párrafo siguiente"
            )}

            {/* Separador */}
            <div className="vr text-secondary me-1 me-md-2 d-none d-sm-block" style={{ height: '30px' }}></div>

            {/* Botón de exportar */}
            {renderTooltipButton(
              <BsDownload />,
              onExport,
              !canExport,
              "outline-success",
              "Exportar audio MP3"
            )}
          </div>

          {/* Indicador de progreso */}
          {paragraphs.length > 0 && mode === 'lector' && (
            <span className="text-light small me-2 me-md-3 d-none d-md-inline">
              {activeIdx + 1} / {paragraphs.length}
            </span>
          )}

          {/* Controles de archivo y modo */}
          <div className="d-flex align-items-center">
            {/* Botón de cambio de modo */}
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="tooltip-mode">
                  {mode === 'editor' ? 'Cambiar a modo lectura' : 'Cambiar a modo edición'}
                </Tooltip>
              }
            >
              <Button
                variant={mode === 'editor' ? 'outline-secondary' : 'outline-primary'}
                size="sm"
                onClick={onToggleMode}
                className="me-1 me-md-2 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '36px', 
                  height: '36px',
                  borderRadius: '8px'
                }}
              >
                {mode === 'editor' ? <BsFileEarmarkText size={18} /> : <BsPencil size={18} />}
              </Button>
            </OverlayTrigger>

            {/* Botón de cargar PDF */}
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tooltip-pdf">Cargar archivo PDF</Tooltip>}
            >
              <Button
                variant="outline-warning"
                size="sm"
                onClick={handlePdfClick}
                className="me-1 me-md-2 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '36px', 
                  height: '36px',
                  borderRadius: '8px'
                }}
              >
                <BsFilePdf size={18} />
              </Button>
            </OverlayTrigger>

            {/* Input oculto para archivos PDF */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={onPdfUpload}
            />

            {/* Botón de nueva conversación */}
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tooltip-new">Nueva conversación</Tooltip>}
            >
              <Button
                variant="outline-success"
                size="sm"
                onClick={onNewConversation}
                className="me-1 me-md-2 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '36px', 
                  height: '36px',
                  borderRadius: '8px'
                }}
              >
                <BsPlus size={20} />
              </Button>
            </OverlayTrigger>

            {/* Botón de historial */}
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tooltip-history">Historial de conversaciones</Tooltip>}
            >
              <Button
                variant="outline-info"
                size="sm"
                onClick={onShowHistory}
                className="d-flex align-items-center justify-content-center"
                style={{ 
                  width: '36px', 
                  height: '36px',
                  borderRadius: '8px'
                }}
              >
                <BsClock size={18} />
              </Button>
            </OverlayTrigger>
          </div>
        </Nav>
      </Container>
    </Navbar>
  );
}
