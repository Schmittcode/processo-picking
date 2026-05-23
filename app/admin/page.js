'use client';
import { useState } from 'react';

export default function AdminPage() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function chamar(url, method = 'GET', body = null) {
    setLoading(true);
    setMsg('Processando...');
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }
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
        <p style={{ color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 20 }}>Gerenciamento de dados de teste</p>

        {msg && (
          <div style={{ backgroundColor: msg.includes('Erro') ? '#cc0000' : '#00875a', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, textAlign: 'center', fontWeight: 'bold', whiteSpace: 'pre-line' }}>
            {msg}
          </div>
        )}

        <div style={card}>
          <h2 style={cardTitle}>🔄 Resetar tudo</h2>
          <p style={cardDesc}>Apaga todos os dados. Use antes de cada demonstração!</p>
          <button style={{...btn, backgroundColor:'#ff4d4d'}} disabled={loading}
            onClick={() => chamar('/api/admin/reset', 'GET')}>
            {loading ? 'AGUARDE...' : 'RESETAR TUDO'}
          </button>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>📦 Caixa 1 — Papeleta 06772401</h2>
          <p style={cardDesc}>3 SKUs: REF 1000079, 200045, 300012</p>
          <button style={{...btn, backgroundColor:'#223a8e'}} disabled={loading}
            onClick={() => chamar('/api/admin/add-caixa', 'POST', { numero: 1 })}>
            {loading ? 'AGUARDE...' : 'ADICIONAR CAIXA 1'}
          </button>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>📦 Caixa 2 — Papeleta 09912345</h2>
          <p style={cardDesc}>4 SKUs: REF 400088, 500011, 600033, 700055</p>
          <button style={{...btn, backgroundColor:'#223a8e'}} disabled={loading}
            onClick={() => chamar('/api/admin/add-caixa', 'POST', { numero: 2 })}>
            {loading ? 'AGUARDE...' : 'ADICIONAR CAIXA 2'}
          </button>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>📦 Caixa 3 — Papeleta 11100999</h2>
          <p style={cardDesc}>2 SKUs: REF 800077, 900099</p>
          <button style={{...btn, backgroundColor:'#223a8e'}} disabled={loading}
            onClick={() => chamar('/api/admin/add-caixa', 'POST', { numero: 3 })}>
            {loading ? 'AGUARDE...' : 'ADICIONAR CAIXA 3'}
          </button>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>📊 Status do banco</h2>
          <p style={cardDesc}>Mostra quantas caixas e bipagens existem</p>
          <button style={{...btn, backgroundColor:'#00875a'}} disabled={loading}
            onClick={() => chamar('/api/admin/status', 'GET')}>
            {loading ? 'AGUARDE...' : 'VER STATUS'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ color: '#00c3ff', textDecoration: 'none', fontSize: 14 }}>← Voltar ao App</a>
        </div>
      </div>
    </div>
  );
}

const card = { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 20, marginBottom: 16 };
const cardTitle = { color: 'white', fontSize: 16, marginBottom: 8 };
const cardDesc = { color: '#aaa', fontSize: 13, marginBottom: 16, lineHeight: 1.5 };
const btn = { width: '100%', padding: 14, border: 'none', borderRadius: 8, color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', textTransform: 'uppercase' };
