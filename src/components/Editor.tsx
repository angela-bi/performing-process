import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { P5_GLOBALS } from '../utils/p5Globals';

const CustomHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#7A5B3A"},
    { tag: t.comment, color: "#747474"},
    { tag: t.string, color: "#48820B" },
    { tag: t.variableName, color: "#0A7CA9" },
    { tag: t.function(t.variableName), color: "#0A7CA9" },
    { tag: t.bool, color: "#D52889" },
]);

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
        EditorView.lineWrapping,
        syntaxHighlighting(CustomHighlightStyle),
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