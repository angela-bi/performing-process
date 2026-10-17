export function Preview({ iframeRef }: { 
    iframeRef: React.RefObject<HTMLIFrameElement | null> 
  }) {
    return (
      <iframe
        ref={iframeRef}
        style={{ width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-scripts allow-same-origin"
        title="p5 sketch"
      />
    );
  }