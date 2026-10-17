import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

export function Editor({ value, onChange }: { 
  value: string;
  onChange: (code: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(null);

  useEffect(() => {
    viewRef.current = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      ],
      parent: editorRef.current!
    });

    return () => viewRef.current?.destroy();
  }, []);

  return <div ref={editorRef} style={{ height: '100%' }} />;
}