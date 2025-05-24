import React, { useState, useEffect, useRef } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import MarkdownEditor from './components/MarkdownEditor.jsx';
import ParagraphView from './components/ParagraphView.jsx';
import StatusBar from './components/StatusBar.jsx';
import { AudioPlayer } from './components/AudioPlayer.js';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { BsInfoCircle } from 'react-icons/bs';
import Navbar from 'react-bootstrap/Navbar';
import './App.css';

function App() {
  console.log('App se está montando');
  // Estado global del lector
  const [text, setText] = useState(localStorage.getItem('lector_text') || '');
  const [paragraphs, setParagraphs] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [status, setStatus] = useState('Listo');
  const [mode, setMode] = useState('editor'); // 'editor' o 'lector'
  const [speed, setSpeed] = useState('1');
  
  // Estados de reproducción
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audios, setAudios] = useState([]);
  const [cancelRequested, setCancelRequested] = useState(false);
  
  // Referencias
  const audioRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const audioContainerRef = useRef(null);


  // Guardar texto en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('lector_text', text);
  }, [text]);

  // Función para mostrar errores
  const showError = (msg) => {
    alert(msg);
  };

  // Reproducir audio en índice específico
  const playAudioAtIndex = async (idx, audioUrls) => {
    if (cancelRequested || idx >= audioUrls.length) return;
    
    setActiveIdx(idx);
    setStatus(`Cargando parte ${idx + 1} de ${paragraphs.length}...`);
    
    const url = audioUrls[idx];
    
    // Esperar a que el audio esté disponible
    for (let i = 0; i < 60; i++) {
      if (cancelRequested) return;
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        if (resp.ok) break;
      } catch {
        // Ignorar errores de cabecera
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    audioPlayerRef.current.setSource(url);
    audioPlayerRef.current.play();
    setStatus(`Reproduciendo parte ${idx + 1} de ${paragraphs.length}`);
  };

  // Controles de reproducción
  const handlePause = () => {
    if (audioPlayerRef.current && !audioPlayerRef.current.isPaused()) {
      audioPlayerRef.current.pause();
      setIsPaused(true);
      setStatus('Reproducción pausada');
    }
  };

  const handleResume = () => {
    if (audioPlayerRef.current && isPaused) {
      audioPlayerRef.current.play();
      setIsPaused(false);
      setStatus(`Reproduciendo parte ${activeIdx + 1} de ${paragraphs.length}`);
    }
  };

  // Navegación
  const handlePrev = () => {
    if (activeIdx > 0) {
      const newIdx = activeIdx - 1;
      if (audioRef.current) audioRef.current.pause();
      setActiveIdx(newIdx);
      if (audios.length) playAudioAtIndex(newIdx, audios);
    }
  };

  const handleNext = () => {
    if (activeIdx < paragraphs.length - 1) {
      const newIdx = activeIdx + 1;
      if (audioRef.current) audioRef.current.pause();
      setActiveIdx(newIdx);
      if (audios.length) playAudioAtIndex(newIdx, audios);
    }
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode !== 'lector') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (audioRef.current && !audioRef.current.paused) {
          handlePause();
        } else if (audioRef.current && isPaused) {
          handleResume();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, isPaused, activeIdx, audios.length, handlePause, handleResume, handleNext, handlePrev]);

  // Alternar entre modo editor y modo lector
  const toggleMode = () => {
    const newMode = mode === 'editor' ? 'lector' : 'editor';
    setMode(newMode);
    if (newMode === 'lector' && paragraphs.length > 0) {
      setActiveIdx(0);
    }
  };

  // División inteligente de texto usando el backend
  const handleSplit = async () => {
    if (!text.trim()) {
      setStatus('El texto está vacío.');
      showError('Por favor ingresa texto para leer');
      return;
    }

    setStatus('Procesando texto...');
    
    try {
      const response = await fetch('/smart_split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (!data.parts || !data.parts.length) {
        showError('No se pudo dividir el texto.');
        setStatus('No se pudo dividir el texto.');
        return;
      }
      
      setParagraphs(data.parts);
      setActiveIdx(0);
      setStatus('Texto dividido en párrafos.');
      setMode('lector');
      
    } catch (err) {
      showError('Error de conexión con el servidor (smart_split).');
      setStatus('Error de conexión.');
      console.error('Split error:', err);
    }
  };

  // Función principal de reproducción
  const handlePlay = async () => {
    if (!text.trim()) {
      showError('Por favor ingresa texto para leer');
      return;
    }

    setIsPlaying(true);
    setCancelRequested(false);
    setStatus('Procesando texto...');

    // Primero dividir el texto si no está dividido
    if (paragraphs.length === 0) {
      await handleSplit();
    }

    // Limpiar caché anterior
    try {
      await fetch('/clear_cache', { method: 'POST' });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }

    try {
      const response = await fetch('/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (!data.audio_urls || !data.audio_urls.length) {
        showError('No se pudo generar el audio.');
        setStatus('No se pudo generar el audio.');
        setIsPlaying(false);
        return;
      }
      
      setAudios(data.audio_urls);
      
      // Crear elemento de audio si no existe
      if (!audioRef.current) {
        const audioElem = document.createElement('audio');
        audioElem.id = 'mainAudio';
        audioElem.controls = true;
        audioElem.style.width = '100%';
        audioContainerRef.current?.appendChild(audioElem);
        audioRef.current = audioElem;
      }
      
      // Inicializar AudioPlayer
      audioPlayerRef.current = new AudioPlayer(audioRef.current, async () => {
        if (isPaused || cancelRequested) return;
        
        // Eliminar audio actual del servidor
        if (activeIdx < audios.length) {
          try {
            await fetch('/delete_audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: audios[activeIdx] })
            });
          } catch (error) {
            console.warn('Error deleting audio:', error);
          }
        }
        
        const nextIdx = activeIdx + 1;
        setActiveIdx(nextIdx);
        
        if (nextIdx < data.audio_urls.length) {
          playAudioAtIndex(nextIdx, data.audio_urls);
        } else {
          setStatus('Reproducción completada');
          setIsPlaying(false);
          setMode('editor');
        }
      });
      
      audioPlayerRef.current.setSpeed(Number(speed));
      
      // Iniciar reproducción
      setActiveIdx(0);
      playAudioAtIndex(0, data.audio_urls);
      
    } catch (err) {
      showError('Error de conexión con el servidor.');
      setStatus('Error de conexión.');
      setIsPlaying(false);
      console.error('TTS error:', err);
    }
  };

  const handleCancel = async () => {
    setCancelRequested(true);
    setIsPlaying(false);
    setIsPaused(false);
    
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = '';
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setStatus('Lectura cancelada');
    setMode('editor');
  };

  // Navegación de párrafos
  const handleSelectParagraph = (idx) => {
    if (idx >= 0 && idx < paragraphs.length && audios.length && idx < audios.length) {
      if (audioRef.current) audioRef.current.pause();
      setActiveIdx(idx);
      playAudioAtIndex(idx, audios);
    }
  };

  // Cambio de velocidad
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setSpeed(Number(newSpeed));
    }
  };

  // Exportar audio
  const handleExport = async () => {
    setStatus('Exportando audio...');
    
    try {
      const response = await fetch('/export_all', { method: 'POST' });
      const data = await response.json();
      
      if (data.export_url) {
        const a = document.createElement('a');
        a.href = data.export_url;
        a.download = 'lectura_completa.mp3';
        a.click();
        setStatus('Audio exportado con éxito');
      } else {
        setStatus('Error al exportar el audio');
        showError('No se pudo exportar el audio.');
      }
    } catch (err) {
      setStatus('Error al exportar el audio');
      showError('No se pudo exportar el audio.');
      console.error('Export error:', err);
    }
  };

  // Función para cargar PDF
  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('Cargando PDF...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/upload_pdf', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.text) {
        setText(data.text);
        setStatus('PDF cargado exitosamente');
      } else {
        showError('No se pudo extraer texto del PDF');
        setStatus('Error al cargar PDF');
      }
    } catch (err) {
      showError('Error al cargar el PDF');
      setStatus('Error al cargar PDF');
      console.error('PDF upload error:', err);
    }
  };

  const getStatusColor = () => {
    if (status.toLowerCase().includes('error')) return 'bg-danger';
    if (status.toLowerCase().includes('listo') || status.toLowerCase().includes('completada') || status.toLowerCase().includes('exitosa')) return 'bg-success';
    if (status.toLowerCase().includes('procesando') || status.toLowerCase().includes('cargando')) return 'bg-warning';
    return 'bg-secondary';
  };

  // Renderizado
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">Lector de Textos IA</Navbar.Brand>
        </Container>
      </Navbar>
      <Container fluid className="min-vh-100 py-4 pt-0">
        <Row>
          {/* Barra lateral de control */}
          <Col xs={12} lg={4} className="mb-4 mb-lg-0">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <h4 className="mb-0">Control de Lectura</h4>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id="shortcut-tooltip" className="shortcut-tooltip">
                        <div className="shortcut-info p-2">
                          <h6>Atajos de teclado:</h6>
                          <ul className="small mb-0">
                            <li><kbd>Espacio</kbd> - Pausar/Reanudar</li>
                            <li><kbd>←</kbd><kbd>→</kbd> - Anterior/Siguiente párrafo</li>
                          </ul>
                        </div>
                      </Tooltip>
                    }
                  >
                    <Button variant="outline-info" size="sm" className="ms-2 p-1 d-flex align-items-center" style={{ borderRadius: '50%' }}>
                      <BsInfoCircle size={20} />
                    </Button>
                  </OverlayTrigger>
                </div>

                <Button
                  variant="secondary"
                  className="w-100 mb-3"
                  onClick={toggleMode}
                >
                  {mode === 'editor' ? 'Cambiar a modo lectura' : 'Cambiar a modo edición'}
                </Button>

                {/* Grid para Velocidad y Reproducir */}
                <div className="d-grid mb-2" style={{ gridTemplateColumns: '3fr 9fr', gap: '0.5rem' }}>
                  <Form.Group controlId="speedSelector">
                    <Form.Label visuallyHidden>Velocidad</Form.Label>
                    <Form.Select
                      value={speed}
                      onChange={e => handleSpeedChange(e.target.value)}
                      size="sm"
                      className="h-100"
                    >
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="1.75">1.75x</option>
                      <option value="2">2x</option>
                    </Form.Select>
                  </Form.Group>
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={handlePlay}
                    disabled={isPlaying && mode === 'lector'} // Deshabilitar si ya está reproduciendo en modo lector
                  >
                    <i className="bi bi-play-fill me-2"></i>
                    {paragraphs.length > 0 && mode === 'lector' ? 'Reproducir' : 'Dividir y Reproducir'}
                  </Button>
                </div>

                {/* Grid para Pausa, Reanudar, Cancelar */}
                <div className="d-grid mb-2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <Button variant="warning" onClick={handlePause} disabled={!isPlaying || isPaused} className="w-100">
                    <i className="bi bi-pause-fill me-1"></i>Pausar
                  </Button>
                  <Button variant="success" onClick={handleResume} disabled={!isPlaying || !isPaused} className="w-100">
                    <i className="bi bi-play-fill me-1"></i>Reanudar
                  </Button>
                  <Button variant="danger" onClick={handleCancel} disabled={!isPlaying} className="w-100">
                    <i className="bi bi-x-circle me-1"></i>Cancelar
                  </Button>
                </div>

                {/* Grid para Anterior y Siguiente */}
                <div className="d-grid mb-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <Button variant="outline-primary" onClick={handlePrev} disabled={activeIdx <= 0 || !isPlaying} className="w-100">
                    <i className="bi bi-skip-start-fill me-1"></i>Anterior
                  </Button>
                  <Button variant="outline-primary" onClick={handleNext} disabled={activeIdx >= paragraphs.length - 1 || !isPlaying} className="w-100">
                    <i className="bi bi-skip-end-fill me-1"></i>Siguiente
                  </Button>
                </div>
                
                <Button
                  variant="outline-success"
                  className="w-100 mb-3"
                  onClick={handleExport}
                  disabled={!audios.length} // Habilitar si hay audios generados
                >
                  <i className="bi bi-download me-2"></i>
                  Exportar Audio MP3
                </Button>

                <div ref={audioContainerRef} className="mb-auto"></div> {/* mb-auto para empujar lo siguiente hacia abajo */}
                
                {/* Nueva ubicación para importar PDF y estado visual */}
                <div className="mt-auto border-top pt-2">
                  <Form.Group controlId="pdfInput" className="mb-2">
                    <Form.Label visuallyHidden>Importar PDF</Form.Label>
                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      aria-label="Cargar PDF"
                      onChange={handlePdfUpload}
                      size="sm"
                    />
                  </Form.Group>
                  <div className="d-flex align-items-center">
                    <div 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        marginRight: '10px',
                        transition: 'background-color 0.3s ease'
                      }} 
                      className={getStatusColor()}
                      title={status} // Mostrar estado como tooltip
                    ></div>
                    <span className="small text-muted">{status}</span> {/* Mantener el texto del estado por ahora */}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {/* Área principal: editor o lector */}
          <Col xs={12} lg={8}>
            <Card className="h-100">
              <Card.Body>
                {mode === 'editor' ? (
                  <div>
                    <h4 className="mb-3">Editor de Texto</h4>
                    <MarkdownEditor value={text} onChange={setText} />
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="primary" 
                        className="mt-2 px-4" 
                        onClick={handlePlay}
                      >
                        Dividir y Reproducir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="mb-3">
                      Lector de Párrafos 
                      <span className="text-muted small">
                        ({activeIdx + 1} de {paragraphs.length})
                      </span>
                    </h4>
                    <ParagraphView 
                      parts={paragraphs} 
                      activeIdx={activeIdx} 
                      onSelect={handleSelectParagraph} 
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
