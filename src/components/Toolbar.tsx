interface ToolbarProps {
    onRun: () => void;
    onClear: () => void;
  }
  
  export function Toolbar({ onRun, onClear }: ToolbarProps) {
    return (
      <div style={{
        display: 'flex',
        gap: '2px',
        padding: '2px 8px',
        borderBottom: '1px dashed #ccc',
        backgroundColor: '#f5f5f5',
      }}>
        <button onClick={onRun} style={{border: "none", background: "transparent", padding: '2px 0px'}}>
            <svg width="40px" height="40px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <circle r="8" cx="9" cy="9" fill="#ED225E"/>
                <polygon points="5.5 5 13 9 5 14" fill="white"/>
            </svg>
        </button>
        {/* <button onClick={onUndo}>↩ Undo</button> */}
        <button onClick={onClear} style={{border: "none", background: "transparent", padding: '2px 2px'}}>
            <svg width="40px" height="40px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <circle r="8" cx="9" cy="9" fill="#bdbdbd"/>
                <rect width="7" height="7" x="5.5" y="5.5" fill="#474747"/>
            </svg>
        </button>
      </div>
    );
  }