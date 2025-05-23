import { AudioPlayer } from './audioPlayer.js';
import { showError, updateStatus } from './uiUtils.js';

// --- Componente de Editor de Texto (Markdown avanzado con SimpleMDE) ---
function createEditorComponent(container, initialText, onChange) {
    container.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.id = 'markdownEditor';
    textarea.value = initialText || '';
    container.appendChild(textarea);
    // Espera a que SimpleMDE esté disponible
    setTimeout(() => {
        if (window.SimpleMDE) {
            const simplemde = new window.SimpleMDE({
                element: textarea,
                initialValue: initialText || '',
                spellChecker: false,
                status: false,
                autofocus: true,
                autosave: false,
                placeholder: 'Pega o escribe tu texto aquí...'
            });
            simplemde.codemirror.on('change', () => {
                onChange(simplemde.value());
            });
            // Devuelve el objeto SimpleMDE para control externo si se requiere
            container._simplemde = simplemde;
        }
    }, 100);
    return textarea;
}

// --- Componente de Vista de Párrafos Interactivos ---
function createParagraphViewComponent(container, parts, onSelect, activeIdx = 0) {
    container.innerHTML = '';
    parts.forEach((p, idx) => {
        const para = document.createElement('div');
        para.className = 'paragraph-item' + (idx === activeIdx ? ' active-paragraph' : '');
        para.textContent = p;
        para.tabIndex = 0;
        para.setAttribute('data-idx', idx);
        para.onclick = () => onSelect(idx);
        container.appendChild(para);
    });
    const active = container.querySelector('.active-paragraph');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.addEventListener('DOMContentLoaded', () => {
    // --- Referencias DOM ---
    const editorContainer = document.getElementById('editorContainer');
    const paragraphView = document.getElementById('paragraphView');
    const playBtn = document.getElementById('playBtn');
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    const audioContainer = document.getElementById('audioContainer');
    const statusBar = document.getElementById('statusBar');
    const cancelBtn = document.getElementById('cancelBtn');
    const exportBtn = document.getElementById('exportBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const speedSelector = document.getElementById('speedSelector');

    // --- Estado global ---
    let mode = 'edit'; // 'edit' o 'read'
    let text = localStorage.getItem('lector_text') || '';
    let textParts = [];
    let current = 0;
    let audios = [];
    let audioElem = null;
    let audioPlayer = null;
    let cancelRequested = false;
    let isPaused = false;

    // --- Inicializa editor ---
    let textarea = createEditorComponent(editorContainer, text, (val) => {
        text = val;
        localStorage.setItem('lector_text', text);
    });
    paragraphView.style.display = 'none';

    // --- Cambiar modo (lectura/escritura) ---
    function setMode(newMode) {
        mode = newMode;
        if (mode === 'edit') {
            editorContainer.style.display = '';
            paragraphView.style.display = 'none';
            playBtn.disabled = false;
            toggleModeBtn.textContent = 'Cambiar a modo lectura';
        } else {
            editorContainer.style.display = 'none';
            paragraphView.style.display = '';
            playBtn.disabled = false;
            toggleModeBtn.textContent = 'Cambiar a modo edición';
        }
    }
    toggleModeBtn.onclick = () => {
        setMode(mode === 'edit' ? 'read' : 'edit');
        if (mode === 'read') {
            createParagraphViewComponent(paragraphView, textParts, jumpToPart, current);
        }
    };

    // --- Lógica de reproducción ---
    playBtn.onclick = async () => {
        if (!text.trim()) {
            showError('Por favor ingresa texto para leer');
            return;
        }
        playBtn.disabled = true;
        updateStatus(statusBar, 'Procesando texto...');
        let splitData;
        try {
            const splitRes = await fetch('/smart_split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            splitData = await splitRes.json();
        } catch (err) {
            showError('Error de conexión con el servidor (smart_split).');
            updateStatus(statusBar, 'Error de conexión.');
            playBtn.disabled = false;
            return;
        }
        if (!splitData.parts || !splitData.parts.length) {
            showError('No se pudo dividir el texto.');
            updateStatus(statusBar, 'No se pudo dividir el texto.');
            playBtn.disabled = false;
            return;
        }
        textParts = splitData.parts;
        current = 0;
        setMode('read');
        createParagraphViewComponent(paragraphView, textParts, jumpToPart, current);
        await fetch('/clear_cache', { method: 'POST' });
        let data;
        try {
            const res = await fetch('/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            data = await res.json();
        } catch (err) {
            showError('Error de conexión con el servidor.');
            updateStatus(statusBar, 'Error de conexión.');
            playBtn.disabled = false;
            return;
        }
        if (!data.audio_urls || !data.audio_urls.length) {
            showError('No se pudo generar el audio.');
            updateStatus(statusBar, 'No se pudo generar el audio.');
            playBtn.disabled = false;
            return;
        }
        audios = data.audio_urls;
        audioElem = document.getElementById('mainAudio');
        if (!audioElem) {
            audioElem = document.createElement('audio');
            audioElem.id = 'mainAudio';
            audioElem.controls = true;
            audioElem.style.width = '100%';
            audioContainer.appendChild(audioElem);
        }
        audioPlayer = new AudioPlayer(audioElem, async () => {
            if (isPaused) return;
            if (current < audios.length) {
                await fetch('/delete_audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: audios[current] })
                });
            }
            current++;
            playNext();
        });
        audioPlayer.setSpeed(Number(speedSelector.value));
        speedSelector.onchange = () => {
            audioPlayer.setSpeed(Number(speedSelector.value));
        };
        playNext();
    };

    // --- Navegación y control de párrafos ---
    function jumpToPart(idx) {
        if (idx >= 0 && idx < textParts.length && audios.length && idx < audios.length) {
            current = idx;
            if (audioElem) audioElem.pause();
            createParagraphViewComponent(paragraphView, textParts, jumpToPart, current);
            playNext();
        }
    }
    window.playNext = async function playNext() {
        if (cancelRequested) return;
        if (current < audios.length && current < textParts.length) {
            createParagraphViewComponent(paragraphView, textParts, jumpToPart, current);
            updateStatus(statusBar, `Cargando parte ${current + 1} de ${textParts.length}...`);
            const url = audios[current];
            for (let i = 0; i < 60; i++) {
                if (cancelRequested) return;
                try {
                    const resp = await fetch(url, { method: 'HEAD' });
                    if (resp.ok) break;
                } catch {}
                await new Promise(r => setTimeout(r, 500));
            }
            audioPlayer.setSource(url);
            audioPlayer.play();
            updateStatus(statusBar, `Reproduciendo parte ${current + 1} de ${textParts.length}`);
        } else if (current >= audios.length) {
            createParagraphViewComponent(paragraphView, textParts, jumpToPart, -1);
            updateStatus(statusBar, 'Reproducción completada');
            setMode('edit');
        }
    };

    // --- Botones de control ---
    cancelBtn.onclick = async () => {
        cancelRequested = true;
        audioContainer.innerHTML = '';
        if (audioElem) audioElem.pause();
        updateStatus(statusBar, 'Lectura cancelada');
        setMode('edit');
    };
    exportBtn.onclick = async () => {
        exportBtn.disabled = true;
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Exportando...`;
        updateStatus(statusBar, 'Exportando audio...');
        const res = await fetch('/export_all', { method: 'POST' });
        const data = await res.json();
        exportBtn.disabled = false;
        exportBtn.innerHTML = originalText;
        if (data.export_url) {
            const a = document.createElement('a');
            a.href = data.export_url;
            a.download = 'lectura_completa.mp3';
            a.click();
            updateStatus(statusBar, 'Audio exportado con éxito');
        } else {
            updateStatus(statusBar, 'Error al exportar el audio');
            showError('No se pudo exportar el audio.');
        }
    };
    pauseBtn.onclick = () => {
        if (audioElem && !audioElem.paused) {
            audioElem.pause();
            isPaused = true;
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = '';
            updateStatus(statusBar, 'Reproducción pausada');
        }
    };
    resumeBtn.onclick = () => {
        if (audioElem && isPaused) {
            audioElem.play();
            isPaused = false;
            pauseBtn.style.display = '';
            resumeBtn.style.display = 'none';
            updateStatus(statusBar, `Reproduciendo parte ${current + 1} de ${textParts.length}`);
        }
    };
    prevBtn.onclick = () => {
        if (current > 0) {
            current--;
            if (audioElem) audioElem.pause();
            playNext();
        }
    };
    nextBtn.onclick = () => {
        if (current < audios.length - 1) {
            current++;
            if (audioElem) audioElem.pause();
            playNext();
        }
    };

    // --- Atajos de teclado ---
    document.addEventListener('keydown', function(e) {
        if (mode === 'edit') return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (audioElem && !audioElem.paused) {
                pauseBtn.click();
            } else if (audioElem && isPaused) {
                resumeBtn.click();
            }
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (current < audios.length - 1) {
                current++;
                playNext();
            }
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (current > 0) {
                current--;
                playNext();
            }
        }
    });
});
