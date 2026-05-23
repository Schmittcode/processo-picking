'use client';
import { useState, useEffect, useRef } from 'react';

// ============================================================
// TELAS: login | menu | abertura | coleta | parcial | finalizada
// ============================================================

export default function Home() {
  const [tela, setTela] = useState('login');
  const [supervisor, setSupervisor] = useState('');
  const [operador, setOperador] = useState('');
  const [papeleta, setPapeleta] = useState('');
  const [caixaInfo, setCaixaInfo] = useState(null);
  const [listaPicking, setListaPicking] = useState([]);
  const [itemAtualIndice, setItemAtualIndice] = useState(0);
  const [pecasColetadas, setPecasColetadas] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'sucesso' | 'sku_completa' | 'erro_sku' | 'sem_saldo' | 'item_falta' | 'retomada'
  const [proximoEndereco, setProximoEndereco] = useState('');
  const [resumo, setResumo] = useState({ itens: 0, pecas: 0 });
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const inputBipRef = useRef(null);
  const inputSupRef = useRef(null);
  const inputOpRef = useRef(null);
  const inputPapRef = useRef(null);

  // Foco automático nos inputs
  useEffect(() => {
    if (tela === 'login') inputSupRef.current?.focus();
    if (tela === 'abertura') inputPapRef.current?.focus();
    if (tela === 'coleta' && !feedback) setTimeout(() => inputBipRef.current?.focus(), 200);
  }, [tela, feedback]);

  // ============================================================
  // LOGIN
  // ============================================================
  async function fazerLogin() {
    if (!supervisor || !operador) { alert('Bipe o Supervisor e o Operador!'); return; }
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisor, operador })
      });
      const data = await res.json();
      if (data.success) setTela('menu');
      else alert('Acesso Negado! Verifique os códigos.');
    } catch { alert('Erro de conexão com o servidor.'); }
  }

  // ============================================================
  // ABRIR CAIXA
  // ============================================================
  async function abrirCaixa(e) {
    if (e.key !== 'Enter' || !papeleta) return;
    try {
      const res = await fetch('/api/caixas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papeleta })
      });
      const data = await res.json();
      if (!data.success) { alert('Caixa não encontrada!'); return; }

      setListaPicking(data.itens);
      setCaixaInfo(data.caixa);

      if (data.progresso.item_atual > 0 || data.progresso.pecas_no_item > 0) {
        setItemAtualIndice(data.progresso.item_atual);
        setPecasColetadas(data.progresso.pecas_no_item);
        setFeedback('retomada');
        setTimeout(() => { setFeedback(null); setTela('coleta'); }, 2500);
      } else {
        setItemAtualIndice(0);
        setPecasColetadas(0);
      }
    } catch { alert('Erro ao abrir caixa.'); }
  }

  function confirmarInicio() {
    setTela('coleta');
  }

  // ============================================================
  // COLETA / BIPAGEM
  // ============================================================
  const itemAtual = listaPicking[itemAtualIndice];

  async function processarBipagem(e) {
    if (e.key !== 'Enter' || !codigoDigitado) return;
    const codigo = codigoDigitado.trim();
    setCodigoDigitado('');

    if (!itemAtual) return;

    try {
      const res = await fetch('/api/picking/bipar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          papeleta,
          codigo_peca: codigo,
          operador,
          item_id: itemAtual.id
        })
      });
      const data = await res.json();

      if (!data.success) {
        setFeedback(data.tipo === 'sem_saldo' ? 'sem_saldo' : 'erro_sku');
        return;
      }

      const novasPecas = pecasColetadas + 1;

      if (data.completo) {
        const proxIdx = itemAtualIndice + 1;
        if (proxIdx < listaPicking.length) {
          setProximoEndereco(listaPicking[proxIdx].endereco);
          setFeedback('sku_completa');
          setTimeout(() => {
            setItemAtualIndice(proxIdx);
            setPecasColetadas(0);
            setFeedback(null);
          }, 1800);
        } else {
          // CAIXA FINALIZADA
          const totalPecas = listaPicking.reduce((acc, i) => acc + i.qtd, 0);
          setResumo({ itens: listaPicking.length, pecas: totalPecas });
          await salvarCaixa(true);
          setTela('finalizada');
        }
      } else {
        setPecasColetadas(novasPecas);
        setFeedback('sucesso');
        setTimeout(() => setFeedback(null), 600);
      }
    } catch { alert('Erro ao bipar peça.'); }
  }

  async function salvarCaixa(finalizada = false) {
    await fetch('/api/picking/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        papeleta,
        operador,
        item_atual: itemAtualIndice,
        pecas_no_item: pecasColetadas,
        finalizada
      })
    });
  }

  function pularSku() {
    setFeedback(null);
    const prox = itemAtualIndice + 1;
    if (prox < listaPicking.length) {
      setItemAtualIndice(prox);
      setPecasColetadas(0);
    } else {
      setTela('finalizada');
    }
  }

  function resetarParaNovaCaixa() {
    setPapeleta('');
    setListaPicking([]);
    setCaixaInfo(null);
    setItemAtualIndice(0);
    setPecasColetadas(0);
    setFeedback(null);
    setCodigoDigitado('');
    setTela('abertura');
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={estilos.body}>
      <div style={estilos.container}>

        {/* ===== LOGIN ===== */}
        {tela === 'login' && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Picking 1° Turno</h1></header>
            <main style={estilos.main}>
              <label style={estilos.label}>Código do Supervisor</label>
              <input ref={inputSupRef} style={estilos.input} value={supervisor}
                onChange={e => setSupervisor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inputOpRef.current?.focus()}
                placeholder="Bipe o código" />
              <label style={estilos.label}>Código do Operador</label>
              <input ref={inputOpRef} style={estilos.input} value={operador}
                onChange={e => setOperador(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fazerLogin()}
                placeholder="Bipe o código" />
              <button style={estilos.btnEntrar} onClick={fazerLogin}>ENTRAR</button>
            </main>
          </>
        )}

        {/* ===== MENU ===== */}
        {tela === 'menu' && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Menu Principal</h1></header>
            <main style={{...estilos.main, gap: 12}}>
              <button style={{...estilos.btnMenu, backgroundColor: '#5cb85c', color: 'white'}}
                onClick={() => setTela('abertura')}>Montar Pedido</button>
              <button style={estilos.btnMenu}>Consultar Estoque</button>
              <button style={estilos.btnMenu}>Inventário</button>
            </main>
          </>
        )}

        {/* ===== ABERTURA DE CAIXA ===== */}
        {tela === 'abertura' && !caixaInfo && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Abertura de Caixa</h1></header>
            <main style={{...estilos.main, alignItems: 'center', padding: 30}}>
              <p style={{color:'#555',fontSize:18,fontWeight:'bold',marginBottom:30,textAlign:'center'}}>
                Bipe a papeleta da caixa
              </p>
              <div style={{border:'2px dashed #ccc',borderRadius:15,padding:30,display:'flex',flexDirection:'column',alignItems:'center',marginBottom:30,width:'100%'}}>
                <div style={{fontSize:48,marginBottom:10}}>📦</div>
                <div style={{color:'#999',letterSpacing:2}}>||||||||||||||</div>
              </div>
              <input ref={inputPapRef} style={{...estilos.input, border:'2px solid #00bcff', textAlign:'center'}}
                value={papeleta} onChange={e => setPapeleta(e.target.value)}
                onKeyDown={abrirCaixa} placeholder="Aguardando bipagem" />
              <button style={{...estilos.btnCancelar, marginTop: 'auto'}}
                onClick={() => { setTela('menu'); setPapeleta(''); }}>CANCELAR</button>
            </main>
          </>
        )}

        {/* CARD CONFIRMAÇÃO CAIXA */}
        {tela === 'abertura' && caixaInfo && !feedback && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Abertura de Caixa</h1></header>
            <main style={{...estilos.main, alignItems:'center', padding:30}}>
              <div style={{backgroundColor:'#d4edda',border:'2px solid #28a745',borderRadius:15,padding:20,width:'100%',marginTop:20}}>
                <div style={{color:'#28a745',fontWeight:'bold',fontSize:18,marginBottom:15}}>✔ Caixa Identificada</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,padding:'5px 0'}}>
                  <span>Caixa:</span><strong>{papeleta}</strong>
                </div>
                <hr style={{border:0,borderTop:'1px solid #28a745',margin:'10px 0',opacity:0.3}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,padding:'5px 0'}}>
                  <span>Pedido:</span><strong>{caixaInfo.pedido}</strong>
                </div>
              </div>
              <button style={{...estilos.btnConfirmar, marginTop: 'auto'}} onClick={confirmarInicio}>
                Confirmar e iniciar
              </button>
              <button style={estilos.btnCancelar} onClick={() => { setCaixaInfo(null); setPapeleta(''); }}>
                CANCELAR
              </button>
            </main>
          </>
        )}

        {/* ===== RETOMADA ===== */}
        {feedback === 'retomada' && (
          <div style={{...estilos.overlay, backgroundColor:'white', zIndex:9999}}>
            <header style={{...estilos.header, backgroundColor:'#ff7e1a'}}>
              <h1 style={estilos.headerH1}>⚠️ Caixa Parcial Identificada</h1>
            </header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}>
              <div style={{width:100,height:100,border:'6px solid #ff7e1a',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,color:'#ff7e1a',marginBottom:40}}>i</div>
              <div style={{border:'3px solid #ff7e1a',borderRadius:15,padding:20,width:'80%',backgroundColor:'#fff5ed',textAlign:'center',marginBottom:20}}>
                <p>Caixa</p><h2 style={{fontSize:28}}>{papeleta}</h2>
                <p>Progresso Atual</p><h2>{itemAtualIndice}/{listaPicking.length}</h2>
              </div>
              <p style={{color:'#666',fontStyle:'italic'}}>Retomando separação...</p>
              <div style={{display:'flex',gap:8,marginTop:16}}>
                {[0,1,2].map(i => <div key={i} style={{width:15,height:15,backgroundColor:'#ff7e1a',borderRadius:'50%',animation:`bounce 0.6s ${i*0.2}s infinite alternate`}}/>)}
              </div>
            </div>
          </div>
        )}

        {/* ===== COLETA ===== */}
        {tela === 'coleta' && !feedback && itemAtual && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Coleta de Peças</h1></header>
            <main style={{...estilos.main, alignItems:'center', gap:15}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'#e0e0e0',border:'1px solid #999',borderRadius:10,padding:10,width:'100%'}}>
                {[['Ref', itemAtual.ref],['Cor', itemAtual.cor],['Tam', itemAtual.tam]].map(([label, val]) => (
                  <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',fontSize:14}}>
                    <span style={{color:'#666'}}>{label}</span>
                    <strong style={{fontSize:16}}>{val}</strong>
                  </div>
                ))}
              </div>
              <div style={{backgroundColor:'#b3ecff',border:'3px solid #1a3a8a',borderRadius:10,padding:15,textAlign:'center',width:'100%'}}>
                <div style={{fontSize:13,color:'#666',textTransform:'uppercase'}}>ENDEREÇO</div>
                <div style={{fontSize:42,fontWeight:'bold',color:'#1a00ff'}}>{itemAtual.endereco}</div>
              </div>
              <div style={{backgroundColor:'#f9f9f9',border:'2px solid #999',borderRadius:10,padding:10,textAlign:'center',width:'100%'}}>
                <div style={{fontSize:13,color:'#666',textTransform:'uppercase'}}>Progresso</div>
                <div style={{fontSize:32,fontWeight:'bold'}}>{pecasColetadas}/{itemAtual.qtd}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:'auto',width:'100%'}}>
                <button style={{...estilos.btnColeta, backgroundColor:'#223a8e'}}
                  onClick={() => inputBipRef.current?.focus()}>📷 BIPAR PEÇA</button>
                <button style={{...estilos.btnColeta, backgroundColor:'#ff7e1a'}}
                  onClick={() => setFeedback('item_falta')}>⚠️ RETIRAR ITEM EM FALTA</button>
                <button style={{...estilos.btnColeta, backgroundColor:'#8c8c8c'}}
                  onClick={async () => { await salvarCaixa(false); setFeedback('parcial'); }}>💾 SALVAR CAIXA</button>
              </div>
              <input ref={inputBipRef} style={{position:'absolute',opacity:0,pointerEvents:'none'}}
                value={codigoDigitado} onChange={e => setCodigoDigitado(e.target.value)}
                onKeyDown={processarBipagem} />
            </main>
          </>
        )}

        {/* ===== FEEDBACK SUCESSO PEÇA ===== */}
        {tela === 'coleta' && feedback === 'sucesso' && (
          <div style={{...estilos.overlay, backgroundColor:'#4cd137', flexDirection:'column', alignItems:'center', paddingTop:60}}>
            <div style={{fontSize:80, color:'white'}}>✔</div>
            <h1 style={{color:'white', fontSize:32, fontWeight:'bold'}}>1 Peça Lida</h1>
          </div>
        )}

        {/* ===== FEEDBACK SKU COMPLETA ===== */}
        {tela === 'coleta' && feedback === 'sku_completa' && (
          <div style={{...estilos.overlay, backgroundColor:'white', flexDirection:'column'}}>
            <header style={{backgroundColor:'#00c300', padding:20, textAlign:'center', width:'100%'}}>
              <span style={{fontSize:40,color:'white'}}>✔</span>
              <h1 style={{color:'white',fontSize:24,fontWeight:'bold'}}>SKU COMPLETA!</h1>
            </header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}>
              <div style={{width:100,height:100,backgroundColor:'#00c300',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:50,color:'white',marginBottom:20}}>✔</div>
              <p style={{color:'#555',marginBottom:10}}>Próximo endereço:</p>
              <div style={{border:'4px solid #00c300',backgroundColor:'#e2f9e2',borderRadius:15,padding:'15px 40px',marginBottom:20}}>
                <span style={{color:'#006400',fontSize:42,fontWeight:'bold'}}>{proximoEndereco}</span>
              </div>
              <p style={{color:'#666',fontStyle:'italic'}}>Carregando próximo item...</p>
            </div>
          </div>
        )}

        {/* ===== ERRO SKU ===== */}
        {tela === 'coleta' && feedback === 'erro_sku' && (
          <div style={{...estilos.overlay, backgroundColor:'#ff0000', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, textAlign:'center', color:'white'}}>
            <div style={{width:110,height:110,border:'5px solid white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,fontWeight:'bold',marginBottom:20}}>✖</div>
            <h1 style={{fontSize:36,fontWeight:900,marginBottom:10}}>ERRO</h1>
            <p style={{fontSize:24,fontWeight:'bold',marginBottom:25}}>SKU não pertence à caixa</p>
            <div style={{backgroundColor:'#8b0000',border:'2px solid white',borderRadius:10,padding:20,width:'100%',fontSize:19,fontWeight:'bold',marginBottom:40}}>Verifique o código e tente novamente</div>
            <button style={{backgroundColor:'white',color:'#ff0000',border:'none',borderRadius:15,padding:18,width:'100%',fontSize:22,fontWeight:900,textTransform:'uppercase',cursor:'pointer'}}
              onClick={() => { setFeedback(null); inputBipRef.current?.focus(); }}>CONFIRMAR</button>
          </div>
        )}

        {/* ===== SEM SALDO ===== */}
        {tela === 'coleta' && feedback === 'sem_saldo' && (
          <div style={{...estilos.overlay, backgroundColor:'#ff0000', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, textAlign:'center', color:'white'}}>
            <div style={{width:110,height:110,border:'5px solid white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,fontWeight:'bold',marginBottom:20}}>!</div>
            <h1 style={{fontSize:36,fontWeight:900,marginBottom:10}}>ERRO</h1>
            <p style={{fontSize:24,fontWeight:'bold',marginBottom:25}}>Peça sem saldo</p>
            <div style={{backgroundColor:'#b30000',border:'3px solid white',borderRadius:15,padding:25,width:'100%',fontSize:20,fontWeight:'bold',marginBottom:50,lineHeight:1.2}}>Esta peça já foi bipada ou não é mais necessária</div>
            <button style={{backgroundColor:'#ffe6e6',color:'#ff0000',border:'none',borderRadius:15,padding:20,width:'100%',fontSize:32,fontWeight:900,textTransform:'uppercase',cursor:'pointer'}}
              onClick={() => { setFeedback(null); inputBipRef.current?.focus(); }}>CONFIRMAR</button>
          </div>
        )}

        {/* ===== ITEM EM FALTA ===== */}
        {tela === 'coleta' && feedback === 'item_falta' && (
          <div style={{...estilos.overlay, backgroundColor:'white', flexDirection:'column', border:'1px solid #ff7e1a'}}>
            <header style={{backgroundColor:'#ff7e1a', padding:10, textAlign:'center', color:'white'}}>
              <h1 style={{fontSize:22,fontWeight:'bold'}}>⚠️ Item em Falta</h1>
            </header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}>
              <div style={{border:'3px solid #ff4b4b',backgroundColor:'#ffe5e5',borderRadius:10,padding:20,color:'#cc0000',fontWeight:'bold',marginBottom:30,width:'100%'}}>
                Não foi possível encontrar a peça no endereço.
              </div>
              <p style={{color:'#555',marginBottom:30,fontSize:16}}>Deseja buscar localizações alternativas no estoque?</p>
              <div style={{width:'100%',display:'flex',flexDirection:'column',gap:15}}>
                <button style={{backgroundColor:'#00c800',color:'white',border:'none',padding:18,borderRadius:12,fontWeight:'bold',fontSize:18,cursor:'pointer'}}
                  onClick={() => alert('Funcionalidade em desenvolvimento')}>
                  SIM, BUSCAR ALTERNATIVA
                </button>
                <button style={{backgroundColor:'#5d6166',color:'white',border:'none',padding:18,borderRadius:12,fontWeight:'bold',fontSize:18,cursor:'pointer'}}
                  onClick={pularSku}>
                  NÃO, PULAR SKU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PICKING PARCIAL ===== */}
        {feedback === 'parcial' && (
          <div style={{...estilos.overlay, backgroundColor:'#ff7e1a', flexDirection:'column'}}>
            <header style={{backgroundColor:'#e66a00', padding:10, textAlign:'center', color:'white'}}>
              <h1 style={{fontSize:20}}>⚠️ Atenção</h1>
            </header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',color:'white'}}>
              <div style={{width:110,height:110,background:'white',border:'4px solid black',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,color:'black',fontWeight:'bold',marginBottom:20}}>!</div>
              <h2 style={{fontSize:32,marginBottom:25,lineHeight:1.1}}>Caixa com Picking Parcial</h2>
              <div style={{backgroundColor:'#fff1e6',color:'#333',border:'3px solid #ff7e1a',borderRadius:15,padding:20,width:'100%',marginBottom:20}}>
                <p style={{fontSize:18}}>Coloque esta caixa na prateleira de</p>
                <strong style={{fontSize:24,display:'block',marginTop:5}}>Caixas Abertas</strong>
              </div>
              <p style={{fontSize:16,marginBottom:40,opacity:0.9}}>A caixa poderá ser completada posteriormente</p>
              <button style={{backgroundColor:'#fff1e6',color:'#ff7e1a',border:'none',borderRadius:15,padding:20,width:'100%',fontSize:24,fontWeight:900,textTransform:'uppercase',cursor:'pointer'}}
                onClick={() => { setFeedback(null); setTela('menu'); }}>CONFIRMAR E SALVAR</button>
            </div>
          </div>
        )}

        {/* ===== CAIXA FINALIZADA ===== */}
        {tela === 'finalizada' && (
          <>
            <header style={{...estilos.header, backgroundColor:'#1a3a8a'}}>
              <h1 style={{...estilos.headerH1, fontSize:24, fontWeight:900}}>CAIXA FINALIZADA!</h1>
            </header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:30,textAlign:'center',backgroundColor:'#f8f9fa'}}>
              <div style={{width:140,height:140,backgroundColor:'white',border:'5px solid #1a3a8a',borderRadius:'50%',display:'flex',position:'relative',alignItems:'center',justifyContent:'center',fontSize:60,marginBottom:20}}>
                📦
                <div style={{position:'absolute',bottom:5,right:5,background:'#00c300',color:'white',borderRadius:'50%',width:40,height:40,fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid white'}}>✔</div>
              </div>
              <h2 style={{color:'#1a3a8a',fontSize:28,marginBottom:10}}>Tudo pronto!</h2>
              <p style={{color:'#666',fontSize:16,marginBottom:30}}>A caixa foi selada e registrada com sucesso.</p>
              <div style={{width:'100%',background:'white',border:'1px solid #ddd',borderRadius:15,padding:15,marginBottom:40}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee',fontSize:18}}>
                  <span>Itens:</span><strong>{resumo.itens}</strong>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:18}}>
                  <span>Peças:</span><strong>{resumo.pecas}</strong>
                </div>
              </div>
              <button style={{width:'100%',padding:20,backgroundColor:'#00c300',color:'white',border:'none',borderRadius:15,fontSize:20,fontWeight:'bold',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 4px 0 #008a00'}}
                onClick={resetarParaNovaCaixa}>INICIAR NOVA CAIXA</button>
            </div>
          </>
        )}

      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================
const estilos = {
  body: {
    backgroundColor: '#1a1a1a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    minHeight: '100dvh',
  },
  container: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 480,
    minHeight: '100vh',
    minHeight: '100dvh',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#00c3ff',
    padding: 15,
    textAlign: 'center',
    width: '100%',
  },
  headerH1: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'normal',
    textTransform: 'uppercase',
    margin: 0,
  },
  main: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
  },
  label: {
    color: '#333',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: 15,
    border: '1px solid #777',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'white',
    color: '#333',
    fontSize: 18,
    outline: 'none',
  },
  btnEntrar: {
    width: '100%',
    padding: 15,
    border: 'none',
    borderRadius: 8,
    fontSize: 18,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 'auto',
    marginBottom: 20,
    backgroundColor: '#00c3ff',
    color: 'white',
  },
  btnMenu: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    cursor: 'pointer',
    textAlign: 'center',
  },
  btnCancelar: {
    width: '100%',
    padding: 20,
    border: 'none',
    borderRadius: 8,
    fontSize: 18,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: 10,
    backgroundColor: '#ff4d4d',
    color: 'white',
  },
  btnConfirmar: {
    width: '100%',
    padding: 20,
    border: 'none',
    borderRadius: 8,
    fontSize: 18,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: 10,
    backgroundColor: '#00c300',
    color: 'white',
  },
  btnColeta: {
    width: '100%',
    padding: 15,
    border: 'none',
    borderRadius: 10,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    maxWidth: 480,
    height: '100%',
    zIndex: 999,
    display: 'flex',
  },
};
