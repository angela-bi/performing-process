interface ToolbarProps {
    onRun: () => void;
    onUndo: () => void;
    onClear: () => void;
  }
  
  export function Toolbar({ onRun, onUndo, onClear }: ToolbarProps) {
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
      }}>
        <button onClick={onRun}>▶ Run</button>
        <button onClick={onUndo}>↩ Undo</button>
        <button onClick={onClear}>🗑 Clear</button>
      </div>
    );
  }