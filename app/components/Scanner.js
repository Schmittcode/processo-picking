'use client';
import { useEffect, useRef, useState } from 'react';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [erro, setErro] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    let ativo = true;

    async function iniciarScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const devices = await reader.listVideoInputDevices();
        const cameraTraseira = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('tras') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1];

        if (!cameraTraseira) {
          setErro('Nenhuma câmera encontrada');
          return;
        }

        await reader.decodeFromVideoDevice(
          cameraTraseira.deviceId,
          videoRef.current,
          (result, err) => {
            if (result && ativo) {
              ativo = false;
              reader.reset();
              onScan(result.getText());
            }
          }
        );
      } catch (e) {
        setErro('Erro ao acessar câmera: ' + e.message);
      }
    }

    iniciarScanner();

    return () => {
      ativo = false;
      if (readerRef.current) {
        try { readerRef.current.reset(); } catch {}
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#000', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      {erro ? (
        <div style={{ color: 'white', textAlign: 'center', padding: 20 }}>
          <p style={{ fontSize: 18, marginBottom: 20 }}>⚠️ {erro}</p>
          <button onClick={onClose} style={btnStyle}>FECHAR</button>
        </div>
      ) : (
        <>
          <p style={{ color: 'white', marginBottom: 16, fontSize: 16 }}>📷 Aponte para o código de barras</p>
          <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <video ref={videoRef} style={{ width: '100%', borderRadius: 8 }} />
            {/* Mira */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 250, height: 100,
              border: '3px solid #00c3ff', borderRadius: 8,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
            }} />
          </div>
          <button onClick={onClose} style={{ ...btnStyle, marginTop: 24 }}>CANCELAR</button>
        </>
      )}
    </div>
  );
}

const btnStyle = {
  backgroundColor: '#ff4d4d', color: 'white', border: 'none',
  borderRadius: 8, padding: '14px 40px', fontSize: 18,
  fontWeight: 'bold', cursor: 'pointer'
};
