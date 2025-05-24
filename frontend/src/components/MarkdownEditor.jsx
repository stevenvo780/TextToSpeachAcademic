import React from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

export default function MarkdownEditor({ value, onChange }) {
  return (
    <div className="markdown-editor">
      <SimpleMDE
        value={value}
        onChange={onChange}
        options={{
          spellChecker: false,
          status: false,
          autofocus: true,
          autosave: {
            enabled: false
          },
          placeholder: 'Pega o escribe tu texto aquí...\n\nPuedes usar Markdown para formato.',
          toolbar: [
            'bold', 'italic', 'heading', '|',
            'quote', 'unordered-list', 'ordered-list', '|',
            'link', 'table', '|',
            'preview', 'side-by-side', 'fullscreen', '|',
            'guide'
          ],
          renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true,
          }
        }}
      />
    </div>
  );
}
