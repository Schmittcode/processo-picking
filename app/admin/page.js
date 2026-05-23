'use client';
import { useState } from 'react';

export default function AdminPage() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function chamar(url, body = null) {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });
      const data = await res.json();
      setMsg(data.message || data.error || JSON.stringify(data));
    } catch (e) {
      setMsg('Erro: ' + e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <h1 style={{ color: '#00c3ff', textAlign: 'center', marginBottom: 5 }}>⚙️ Admin</h1>
        <p style={{ color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 30 }}>Gerenciamento de dados de teste</p>

        {msg && (
          <div style={{ backgroundColor: '#00c300', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' }}>
            {msg}
          </div>
        )}

        {/* RESET */}
        <div style={card}>
          <h2 style={cardTitle}>🔄 Resetar para apresentação</h2>
          <p style={cardDesc}>Apaga todo o progresso de caixas e bipagens. Use antes da demonstração!</p>
          <button style={{...btn, backgroundColor:'#ff4d4d'}} disabled={loading}
            onClick={() => chamar('/api/admin/reset')}>
            RESETAR TUDO
          </button>
        </div>

        {/* CAIXA 1 */}
        <div style={card}>
          <h2 style={cardTitle}>📦 Caixa de Teste 1</h2>
          <p style={cardDesc}>Papeleta: <strong style={{color:'#00c3ff'}}>06772401</strong> — 3 SKUs, 6 peças no total</p>
          <button style={{...btn, backgroundColor:'#223a8e'}} disabled={loading}
            onClick={() => chamar('/api/admin/add-caixa', { numero: 1 })}>
            ADICIONAR / RESETAR CAIXA 1
          </button>
        </div>

        {/* CAIXA 2 */}
        <div style={card}>
          <h2 style={cardTitle}>📦 Caixa de Teste 2</h2>
          <p style={cardDesc}>Papeleta: <strong style={{color:'#00c3ff'}}>09912345</strong> — 4 SKUs, 8 peças no total</p>
          <button style={{...btn, backgroundColor:'#223a8e'}} disabled={loading}
            onClick={() => chamar('/api/admin/add-caixa', { numero: 2 })}>
            ADICIONAR / RESETAR CAIXA 2
          </button>
        </div>

        {/* CAIXA 3 */}
        <div style={card}>
          <h2 style={cardTitle}>📦 Caixa de Teste 3</h2>
          <p style={cardDesc}>Papeleta: <strong style={{color:'#00c3ff'}}>11100999</strong> — 2 SKUs, 4 peças no total</p>
          <button style={{...btn, backgroundColor:'#223a8e'}} disabled={loading}
            onClick={() => chamar('/api/admin/add-caixa', { numero: 3 })}>
            ADICIONAR / RESETAR CAIXA 3
          </button>
        </div>

        {/* VER STATUS */}
        <div style={card}>
          <h2 style={cardTitle}>📊 Ver status do banco</h2>
          <p style={cardDesc}>Mostra quantas caixas e bipagens existem</p>
          <button style={{...btn, backgroundColor:'#00875a'}} disabled={loading}
            onClick={() => chamar('/api/admin/status')}>
            VER STATUS
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ color: '#00c3ff', textDecoration: 'none', fontSize: 14 }}>← Voltar ao App</a>
        </div>

        {loading && <p style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Processando...</p>}

      </div>
    </div>
  );
}

const card = { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 20, marginBottom: 16 };
const cardTitle = { color: 'white', fontSize: 16, marginBottom: 8 };
const cardDesc = { color: '#aaa', fontSize: 13, marginBottom: 16, lineHeight: 1.5 };
const btn = { width: '100%', padding: 14, border: 'none', borderRadius: 8, color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', textTransform: 'uppercase' };
