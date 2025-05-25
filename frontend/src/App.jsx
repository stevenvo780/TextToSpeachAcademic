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
import NavbarControls from './components/NavbarControls.jsx';
import ConversationHistory from './components/ConversationHistory.jsx';
import { AudioPlayer } from './components/AudioPlayer.js';
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
  
  // Estado para el historial de conversaciones
  const [showHistory, setShowHistory] = useState(false);
  
  // Referencias
  const audioRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const audioContainerRef = useRef(null);


  // Guardar texto en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('lector_text', text);
  }, [text]);

  // Función para guardar conversación en el historial
  const saveConversationToHistory = (textContent, paragraphsContent) => {
    const conversation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: textContent.split('\n')[0]?.substring(0, 50) || 'Sin título',
      preview: textContent.substring(0, 150),
      text: textContent,
      paragraphs: paragraphsContent,
      mode: 'lector'
    };

    const existingHistory = JSON.parse(localStorage.getItem('conversation_history') || '[]');
    const updatedHistory = [conversation, ...existingHistory.slice(0, 19)]; // Mantener solo 20 conversaciones
    localStorage.setItem('conversation_history', JSON.stringify(updatedHistory));
  };

  // Función para cargar conversación del historial
  const loadConversationFromHistory = (conversation) => {
    setText(conversation.text);
    setParagraphs(conversation.paragraphs || []);
    setMode('lector');
    setActiveIdx(0);
    setStatus('Conversación cargada del historial');
    setShowHistory(false);
  };

  // Función para mostrar/ocultar historial
  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleHideHistory = () => {
    setShowHistory(false);
  };

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
      const response = await fetch('http://localhost:5000/smart_split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });
      
      if (!response.ok) throw new Error('Error en el servidor');
      
      const data = await response.json();
      
      if (data.parts && data.parts.length > 0) {
        setParagraphs(data.parts);
        setActiveIdx(0);
        setStatus(`Texto dividido en ${data.parts.length} párrafos`);
        setMode('lector');
        
        // Guardar en historial
        saveConversationToHistory(text, data.parts);
      } else {
        showError('No se pudieron generar párrafos del texto');
        setStatus('Error al procesar el texto');
      }
      
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
      await fetch('http://localhost:5000/clear_cache', { method: 'POST' });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }

    try {
      const response = await fetch('http://localhost:5000/tts', {
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
            await fetch('http://localhost:5000/delete_audio', {
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
      const response = await fetch('http://localhost:5000/export_all', { method: 'POST' });
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
      const response = await fetch('http://localhost:5000/upload_pdf', {
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
      <NavbarControls
        mode={mode}
        speed={speed}
        isPlaying={isPlaying}
        isPaused={isPaused}
        activeIdx={activeIdx}
        paragraphs={paragraphs}
        audios={audios}
        onPlay={handlePlay}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onPrev={handlePrev}
        onNext={handleNext}
        onExport={handleExport}
        onSpeedChange={handleSpeedChange}
        onToggleMode={toggleMode}
        onShowHistory={handleShowHistory}
        onPdfUpload={handlePdfUpload}
      />
      
      <Container fluid className="min-vh-100 py-4 pt-0">
        <Row>
          {/* Área principal: editor o lector */}
          <Col xs={12} lg={8} className="mx-auto">
            <Card className="h-100">
              <Card.Body>
                {mode === 'editor' ? (
                  <div>
                    <h4 className="mb-3">Editor de Texto</h4>
                    <MarkdownEditor value={text} onChange={setText} />
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
                
                {/* Contenedor de audio */}
                <div ref={audioContainerRef} className="mt-3"></div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Barra de estado */}
        <Row className="mt-3">
          <Col xs={12} lg={8} className="mx-auto">
            <div className="d-flex align-items-center justify-content-center">
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  marginRight: '8px',
                  transition: 'background-color 0.3s ease'
                }} 
                className={getStatusColor()}
                title={status}
              ></div>
              <span className="small text-muted">{status}</span>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Historial de conversaciones */}
      <ConversationHistory 
        show={showHistory}
        onHide={handleHideHistory}
        onLoadConversation={loadConversationFromHistory}
      />
    </>
  );
}

export default App;
