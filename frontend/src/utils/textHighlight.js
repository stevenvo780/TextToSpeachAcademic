// textHighlight.js - Funciones de resaltado para React

export function getHighlightedHtml(text, part, highlightClass = 'highlight') {
  if (!part) return text;
  const idx = text.indexOf(part);
  if (idx === -1) return text;
  return (
    text.substring(0, idx) +
    `<span class="${highlightClass}">` +
    part +
    '</span>' +
    text.substring(idx + part.length)
  );
}
