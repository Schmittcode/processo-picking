'use client';

const codigos = [
  {
    categoria: '👤 Supervisores',
    cor: '#1a3a8a',
    itens: [
      { label: 'Supervisor 01', codigo: 'SUPERVISOR01' },
    ]
  },
  {
    categoria: '👷 Operadores',
    cor: '#00875a',
    itens: [
      { label: 'Operador 001', codigo: 'OP001' },
    ]
  },
  {
    categoria: '📦 Papeletas de Caixas',
    cor: '#ff7e1a',
    itens: [
      { label: 'Caixa 06772401 — Pedido 2657808', codigo: '06772401' },
    ]
  },
  {
    categoria: '👕 Peças (SKUs)',
    cor: '#6f42c1',
    itens: [
      { label: 'REF 1000079 — Cor ÚNICO — Tam 18', codigo: 'SKU-1000079-UNICO-18-001' },
      { label: 'REF 1000079 — Cor ÚNICO — Tam 18', codigo: 'SKU-1000079-UNICO-18-002' },
      { label: 'REF 200045 — Cor AZUL — Tam M', codigo: 'SKU-200045-AZUL-M-001' },
      { label: 'REF 200045 — Cor AZUL — Tam M', codigo: 'SKU-200045-AZUL-M-002' },
      { label: 'REF 200045 — Cor AZUL — Tam M', codigo: 'SKU-200045-AZUL-M-003' },
      { label: 'REF 300012 — Cor BRANCO — Tam P', codigo: 'SKU-300012-BRANCO-P-001' },
    ]
  },
];

export default function CodigosPage() {
  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ color: '#1a3a8a', fontSize: 28, marginBottom: 8 }}>📋 Códigos de Demonstração</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Use estes códigos para demonstrar o sistema de picking</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 10, padding: '10px 24px', backgroundColor: '#00c3ff', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>
            ← Voltar ao App
          </a>
        </div>

        {codigos.map((grupo) => (
          <div key={grupo.categoria} style={{ marginBottom: 30 }}>
            <h2 style={{ color: grupo.cor, fontSize: 18, marginBottom: 12, borderBottom: `3px solid ${grupo.cor}`, paddingBottom: 8 }}>
              {grupo.categoria}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {grupo.itens.map((item) => (
                <div key={item.codigo} style={{
                  backgroundColor: 'white', borderRadius: 12, padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center',
                  border: `2px solid ${grupo.cor}20`
                }}>
                  <p style={{ color: '#333', fontSize: 13, marginBottom: 12, fontWeight: 'bold' }}>{item.label}</p>
                  <img
                    src={`https://barcodeapi.org/api/128/${encodeURIComponent(item.codigo)}`}
                    alt={item.codigo}
                    style={{ maxWidth: '100%', height: 70, objectFit: 'contain' }}
                  />
                  <p style={{ color: '#888', fontSize: 11, marginTop: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {item.codigo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 12, padding: 20, marginTop: 20 }}>
          <h3 style={{ color: '#856404', marginBottom: 8 }}>📌 Sequência de demonstração</h3>
          <ol style={{ color: '#555', paddingLeft: 20, lineHeight: 2 }}>
            <li>Bipe o código do <strong>Supervisor 01</strong></li>
            <li>Bipe o código do <strong>Operador 001</strong></li>
            <li>No menu, clique em <strong>Montar Pedido</strong></li>
            <li>Bipe a <strong>Papeleta 06772401</strong></li>
            <li>Confirme e inicie a coleta</li>
            <li>Bipe as peças da <strong>REF 1000079</strong> (2 peças)</li>
            <li>Bipe as peças da <strong>REF 200045</strong> (3 peças)</li>
            <li>Bipe a peça da <strong>REF 300012</strong> (1 peça)</li>
            <li>Caixa finalizada! ✅</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
