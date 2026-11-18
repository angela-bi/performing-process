import { useEffect, useRef, useState } from 'react';
import type { PanelDoc } from '../App';
import { Panel } from './Panel';

interface Props {
  doc: PanelDoc;
  onChange: (changes: Partial<PanelDoc>) => void;
  onFocus: () => void;
  zIndex: number;
}

const isVirtual = (label: string) => /obs|virtual|manycam|snap camera|ndi/i.test(label);

export function CameraWindow(props: Props) {
  const { doc, onChange } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState('');
  const [mirror, setMirror] = useState(true);

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    let stream: MediaStream | undefined;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: doc.deviceId ? { deviceId: { exact: doc.deviceId } } : true,
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        const cams = (await navigator.mediaDevices.enumerateDevices())
          .filter(d => d.kind === 'videoinput');
        setDevices(cams);

        // the browser picked a virtual camera (OBS): switch to a real one, which re-runs this effect
        if (!doc.deviceId && isVirtual(stream.getVideoTracks()[0].label)) {
          const real = cams.find(d => !isVirtual(d.label));
          if (real) { onChange({ deviceId: real.deviceId }); return; }
        }

        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setError('');
      } catch (err) {
        if (cancelled) return;
        setError(String(err));
        if (doc.deviceId) onChange({ deviceId: undefined });   // saved camera is gone: retry with the default next time
        setOn(false);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [on, doc.deviceId]);

  return (
    <Panel
      {...props}
      label="camera"
      headerColor='#f5f5f5'
      minW={240}
      minH={180}
      actions={
        <>
          {devices.length > 1 && (
            <select
              value={doc.deviceId ?? ''}
              onChange={e => onChange({ deviceId: e.target.value })}
              style={{ maxWidth: 130, fontSize: 11 }}
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'camera'}</option>
              ))}
            </select>
          )}
          <label style={{ fontSize: 11, display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={mirror}
              onChange={e => setMirror(e.target.checked)}
              style={{ accentColor: '#ED225E' }}
            />
            mirror
          </label>
          <button
            onClick={() => setOn(o => !o)}
            style={{ padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: on ? '#bdbdbd' : '#ED225E', color: '#fff', fontSize: 11 }}
          >
            {on ? 'Stop' : 'Start'}
          </button>
        </>
      }
    >
      {error && <div style={{ padding: 10, color: '#D52889', fontSize: 11 }}>{error}</div>}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: '100%', height: '100%', objectFit: 'contain', background: '#111', display: 'block',
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      />
    </Panel>
  );
}