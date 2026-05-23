'use client';
import { useState, useEffect, useRef } from 'react';
import Scanner from './components/Scanner';

function beep(freq, duration, type = 'sine', volume = 1.0) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
  } catch {}
}
function beepSucesso()   { beep(1400, 0.12, 'sine', 1.0); }
function beepDuplo()     { beep(1400, 0.1, 'sine', 1.0); setTimeout(() => beep(1700, 0.15, 'sine', 1.0), 160); }
function beepLogin()     { beep(1200, 0.1, 'sine', 1.0); }
function beepCaixa()     { beep(1000, 0.12, 'sine', 1.0); setTimeout(() => beep(1300, 0.12, 'sine', 1.0), 160); }
function beepErro()      { beep(280, 0.5, 'sawtooth', 1.0); }
function beepFinalizado(){ beep(900,0.1,'sine',1.0); setTimeout(()=>beep(1100,0.1,'sine',1.0),150); setTimeout(()=>beep(1500,0.25,'sine',1.0),300); }

export default function Home() {
  const [tela, setTela] = useState('login');
  const [supervisor, setSupervisor] = useState('');
  const [operador, setOperador] = useState('');
  const [papeleta, setPapeleta] = useState('');
  const [caixaInfo, setCaixaInfo] = useState(null);
  const [listaPicking, setListaPicking] = useState([]);
  const [itemAtualIndice, setItemAtualIndice] = useState(0);
  const [pecasColetadas, setPecasColetadas] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [proximoEndereco, setProximoEndereco] = useState('');
  const [resumo, setResumo] = useState({ itens: 0, pecas: 0 });
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const [scanner, setScanner] = useState(null);
  const [estoque, setEstoque] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [caixaSelecionada, setCaixaSelecionada] = useState(null);
  const inputBipRef = useRef(null);
  const inputSupRef = useRef(null);
  const inputOpRef = useRef(null);
  const inputPapRef = useRef(null);

  useEffect(() => {
    if (tela === 'login') inputSupRef.current?.focus();
    if (tela === 'abertura') inputPapRef.current?.focus();
    if (tela === 'coleta' && !feedback) setTimeout(() => inputBipRef.current?.focus(), 200);
    if (tela === 'estoque') carregarEstoque();
    if (tela === 'inventario') carregarInventario();
  }, [tela, feedback]);

  function handleScan(codigo) {
    const tipoAtual = scanner;
    setScanner(null);
    if (tipoAtual === 'supervisor') { beepLogin(); setSupervisor(codigo); }
    if (tipoAtual === 'operador')   { beepLogin(); setOperador(codigo); }
    if (tipoAtual === 'papeleta')   { beepCaixa(); setPapeleta(codigo); abrirCaixaCodigo(codigo); }
    if (tipoAtual === 'peca')       { processarBipagemCodigo(codigo); }
  }

  async function fazerLogin() {
    if (!supervisor || !operador) { alert('Bipe o Supervisor e o Operador!'); return; }
    try {
      const res = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ supervisor, operador }) });
      const data = await res.json();
      if (data.success) { beepLogin(); setTela('menu'); }
      else { beepErro(); alert('Acesso Negado!'); }
    } catch { alert('Erro de conexão.'); }
  }

  async function abrirCaixa(e) {
    if (e.key !== 'Enter' || !papeleta) return;
    await abrirCaixaCodigo(papeleta);
  }

  async function abrirCaixaCodigo(cod) {
    if (!cod) return;
    try {
      const res = await fetch('/api/caixas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ papeleta: cod }) });
      const data = await res.json();
      if (!data.success) { beepErro(); alert('Caixa não encontrada!'); return; }

      // CAIXA JÁ FINALIZADA
      if (data.caixa.status === 'finalizada') {
        beepFinalizado();
        const totalPecas = data.itens.reduce((acc, i) => acc + i.qtd, 0);
        setResumo({ itens: data.itens.length, pecas: totalPecas });
        setListaPicking(data.itens);
        setCaixaInfo(data.caixa);
        setPapeleta(cod);
        setTela('finalizada');
        return;
      }

      beepCaixa();
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

  function confirmarInicio() { beepCaixa(); setTela('coleta'); }

  async function processarBipagem(e) {
    if (e.key !== 'Enter' || !codigoDigitado) return;
    const codigo = codigoDigitado.trim();
    setCodigoDigitado('');
    await processarBipagemCodigo(codigo);
  }

  async function processarBipagemCodigo(codigo) {
    if (!codigo || !itemAtual) return;
    try {
      const res = await fetch('/api/picking/bipar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ papeleta, codigo_peca: codigo, operador, item_id: itemAtual.id }) });
      const data = await res.json();
      if (!data.success) { beepErro(); setFeedback(data.tipo === 'sem_saldo' ? 'sem_saldo' : 'erro_sku'); return; }
      const novasPecas = pecasColetadas + 1;
      if (data.completo) {
        const proxIdx = itemAtualIndice + 1;
        if (proxIdx < listaPicking.length) {
          beepDuplo();
          setProximoEndereco(listaPicking[proxIdx].endereco);
          setFeedback('sku_completa');
          setTimeout(() => { setItemAtualIndice(proxIdx); setPecasColetadas(0); setFeedback(null); }, 1800);
        } else {
          beepFinalizado();
          const totalPecas = listaPicking.reduce((acc, i) => acc + i.qtd, 0);
          setResumo({ itens: listaPicking.length, pecas: totalPecas });
          await salvarCaixa(true);
          setTela('finalizada');
        }
      } else {
        beepSucesso();
        setPecasColetadas(novasPecas);
        setFeedback('sucesso');
        setTimeout(() => setFeedback(null), 600);
      }
    } catch { alert('Erro ao bipar peça.'); }
  }

  async function salvarCaixa(finalizada = false) {
    await fetch('/api/picking/salvar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ papeleta, operador, item_atual: itemAtualIndice, pecas_no_item: pecasColetadas, finalizada }) });
  }

  function pularSku() {
    setFeedback(null);
    const prox = itemAtualIndice + 1;
    if (prox < listaPicking.length) { setItemAtualIndice(prox); setPecasColetadas(0); }
    else setTela('finalizada');
  }

  function resetarParaNovaCaixa() {
    setPapeleta(''); setListaPicking([]); setCaixaInfo(null);
    setItemAtualIndice(0); setPecasColetadas(0); setFeedback(null); setCodigoDigitado('');
    setTela('abertura');
  }

  async function carregarEstoque() {
    try {
      const res = await fetch('/api/estoque');
      const data = await res.json();
      if (data.success) setEstoque(data.caixas);
    } catch {}
  }

  async function carregarInventario() {
    try {
      const res = await fetch('/api/inventario');
      const data = await res.json();
      if (data.success) setInventario(data.caixas);
    } catch {}
  }

  const itemAtual = listaPicking[itemAtualIndice];
  const corStatus = { aberta: '#00c300', parcial: '#ff7e1a', finalizada: '#1a3a8a' };
  const labelStatus = { aberta: 'Aberta', parcial: 'Parcial', finalizada: 'Finalizada' };

  return (
    <div style={estilos.body}>
      <div style={estilos.container}>

        {scanner && <Scanner onScan={handleScan} onClose={() => setScanner(null)} />}

        {/* LOGIN */}
        {tela === 'login' && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Picking 1° Turno</h1></header>
            <main style={estilos.main}>
              <label style={estilos.label}>Código do Supervisor</label>
              <div style={estilos.inputRow}>
                <input ref={inputSupRef} style={estilos.input} value={supervisor}
                  onChange={e => setSupervisor(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'){ beepLogin(); inputOpRef.current?.focus(); }}}
                  inputMode="none" autoComplete="off" placeholder="Bipe o código" />
                <button style={estilos.btnCam} onClick={() => setScanner('supervisor')}>📷</button>
              </div>
              <label style={estilos.label}>Código do Operador</label>
              <div style={estilos.inputRow}>
                <input ref={inputOpRef} style={estilos.input} value={operador}
                  onChange={e => setOperador(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'){ beepLogin(); fazerLogin(); }}}
                  inputMode="none" autoComplete="off" placeholder="Bipe o código" />
                <button style={estilos.btnCam} onClick={() => setScanner('operador')}>📷</button>
              </div>
              <button style={estilos.btnEntrar} onClick={fazerLogin}>ENTRAR</button>
            </main>
          </>
        )}

        {/* MENU */}
        {tela === 'menu' && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Menu Principal</h1></header>
            <main style={{...estilos.main, gap:12}}>
              <button style={{...estilos.btnMenu, backgroundColor:'#5cb85c', color:'white'}} onClick={() => setTela('abertura')}>Montar Pedido</button>
              <button style={{...estilos.btnMenu, backgroundColor:'#223a8e', color:'white'}} onClick={() => setTela('estoque')}>Consultar Estoque</button>
              <button style={{...estilos.btnMenu, backgroundColor:'#6f42c1', color:'white'}} onClick={() => setTela('inventario')}>Inventário</button>
            </main>
          </>
        )}

        {/* ABERTURA */}
        {tela === 'abertura' && !caixaInfo && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Abertura de Caixa</h1></header>
            <main style={{...estilos.main, alignItems:'center', padding:30}}>
              <p style={{color:'#555',fontSize:18,fontWeight:'bold',marginBottom:30,textAlign:'center'}}>Bipe a papeleta da caixa</p>
              <div style={{border:'2px dashed #ccc',borderRadius:15,padding:30,display:'flex',flexDirection:'column',alignItems:'center',marginBottom:30,width:'100%'}}>
                <div style={{fontSize:48,marginBottom:10}}>📦</div>
                <div style={{color:'#999',letterSpacing:2}}>||||||||||||||</div>
              </div>
              <div style={estilos.inputRow}>
                <input ref={inputPapRef} style={{...estilos.input, border:'2px solid #00bcff', textAlign:'center'}}
                  value={papeleta} onChange={e => setPapeleta(e.target.value)}
                  onKeyDown={abrirCaixa} inputMode="none" autoComplete="off" placeholder="Aguardando bipagem" />
                <button style={estilos.btnCam} onClick={() => setScanner('papeleta')}>📷</button>
              </div>
              <button style={{...estilos.btnCancelar, marginTop:'auto'}} onClick={() => { setTela('menu'); setPapeleta(''); }}>CANCELAR</button>
            </main>
          </>
        )}

        {/* CONFIRMAÇÃO CAIXA */}
        {tela === 'abertura' && caixaInfo && !feedback && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Abertura de Caixa</h1></header>
            <main style={{...estilos.main, alignItems:'center', padding:30}}>
              <div style={{backgroundColor:'#d4edda',border:'2px solid #28a745',borderRadius:15,padding:20,width:'100%',marginTop:20}}>
                <div style={{color:'#28a745',fontWeight:'bold',fontSize:18,marginBottom:15}}>✔ Caixa Identificada</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,padding:'5px 0'}}><span>Caixa:</span><strong>{papeleta}</strong></div>
                <hr style={{border:0,borderTop:'1px solid #28a745',margin:'10px 0',opacity:0.3}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,padding:'5px 0'}}><span>Pedido:</span><strong>{caixaInfo.pedido}</strong></div>
              </div>
              <button style={{...estilos.btnConfirmar, marginTop:'auto'}} onClick={confirmarInicio}>Confirmar e iniciar</button>
              <button style={estilos.btnCancelar} onClick={() => { setCaixaInfo(null); setPapeleta(''); }}>CANCELAR</button>
            </main>
          </>
        )}

        {/* RETOMADA */}
        {feedback === 'retomada' && (
          <div style={{...estilos.overlay, backgroundColor:'white', zIndex:9999, flexDirection:'column'}}>
            <header style={{...estilos.header, backgroundColor:'#ff7e1a'}}><h1 style={estilos.headerH1}>⚠️ Caixa Parcial Identificada</h1></header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}>
              <div style={{width:100,height:100,border:'6px solid #ff7e1a',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,color:'#ff7e1a',marginBottom:40}}>i</div>
              <div style={{border:'3px solid #ff7e1a',borderRadius:15,padding:20,width:'80%',backgroundColor:'#fff5ed',textAlign:'center',marginBottom:20}}>
                <p>Caixa</p><h2 style={{fontSize:28}}>{papeleta}</h2>
                <p>Progresso Atual</p><h2>{itemAtualIndice}/{listaPicking.length}</h2>
              </div>
              <p style={{color:'#666',fontStyle:'italic'}}>Retomando separação...</p>
            </div>
          </div>
        )}

        {/* COLETA */}
        {tela === 'coleta' && !feedback && itemAtual && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Coleta de Peças</h1></header>
            <main style={{...estilos.main, alignItems:'center', gap:15}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'#e0e0e0',border:'1px solid #999',borderRadius:10,padding:10,width:'100%'}}>
                {[['Ref',itemAtual.ref],['Cor',itemAtual.cor],['Tam',itemAtual.tam]].map(([l,v])=>(
                  <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',fontSize:14}}>
                    <span style={{color:'#666'}}>{l}</span><strong style={{fontSize:16}}>{v}</strong>
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
                <button style={{...estilos.btnColeta,backgroundColor:'#223a8e'}} onClick={()=>setScanner('peca')}>📷 BIPAR PEÇA</button>
                <button style={{...estilos.btnColeta,backgroundColor:'#ff7e1a'}} onClick={()=>{beepErro();setFeedback('item_falta');}}>⚠️ RETIRAR ITEM EM FALTA</button>
                <button style={{...estilos.btnColeta,backgroundColor:'#8c8c8c'}} onClick={async()=>{await salvarCaixa(false);setFeedback('parcial');}}>💾 SALVAR CAIXA</button>
              </div>
              <input ref={inputBipRef} style={{position:'absolute',opacity:0,pointerEvents:'none'}}
                value={codigoDigitado} onChange={e=>setCodigoDigitado(e.target.value)}
                onKeyDown={processarBipagem} inputMode="none" autoComplete="off" />
            </main>
          </>
        )}

        {/* SUCESSO */}
        {tela==='coleta' && feedback==='sucesso' && (
          <div style={{...estilos.overlay,backgroundColor:'#4cd137',flexDirection:'column',alignItems:'center',paddingTop:60}}>
            <div style={{fontSize:80,color:'white'}}>✔</div>
            <h1 style={{color:'white',fontSize:32,fontWeight:'bold'}}>1 Peça Lida</h1>
          </div>
        )}

        {/* SKU COMPLETA */}
        {tela==='coleta' && feedback==='sku_completa' && (
          <div style={{...estilos.overlay,backgroundColor:'white',flexDirection:'column'}}>
            <header style={{backgroundColor:'#00c300',padding:20,textAlign:'center',width:'100%'}}>
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

        {/* ERRO SKU */}
        {tela==='coleta' && feedback==='erro_sku' && (
          <div style={{...estilos.overlay,backgroundColor:'#ff0000',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',color:'white'}}>
            <div style={{width:110,height:110,border:'5px solid white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,fontWeight:'bold',marginBottom:20}}>✖</div>
            <h1 style={{fontSize:36,fontWeight:900,marginBottom:10}}>ERRO</h1>
            <p style={{fontSize:24,fontWeight:'bold',marginBottom:25}}>SKU não pertence à caixa</p>
            <div style={{backgroundColor:'#8b0000',border:'2px solid white',borderRadius:10,padding:20,width:'100%',fontSize:19,fontWeight:'bold',marginBottom:40}}>Verifique o código e tente novamente</div>
            <button style={{backgroundColor:'white',color:'#ff0000',border:'none',borderRadius:15,padding:18,width:'100%',fontSize:22,fontWeight:900,textTransform:'uppercase',cursor:'pointer'}} onClick={()=>setFeedback(null)}>CONFIRMAR</button>
          </div>
        )}

        {/* SEM SALDO */}
        {tela==='coleta' && feedback==='sem_saldo' && (
          <div style={{...estilos.overlay,backgroundColor:'#ff0000',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',color:'white'}}>
            <div style={{width:110,height:110,border:'5px solid white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,fontWeight:'bold',marginBottom:20}}>!</div>
            <h1 style={{fontSize:36,fontWeight:900,marginBottom:10}}>ERRO</h1>
            <p style={{fontSize:24,fontWeight:'bold',marginBottom:25}}>Peça sem saldo</p>
            <div style={{backgroundColor:'#b30000',border:'3px solid white',borderRadius:15,padding:25,width:'100%',fontSize:20,fontWeight:'bold',marginBottom:50,lineHeight:1.2}}>Esta peça já foi bipada ou não é mais necessária</div>
            <button style={{backgroundColor:'#ffe6e6',color:'#ff0000',border:'none',borderRadius:15,padding:20,width:'100%',fontSize:32,fontWeight:900,textTransform:'uppercase',cursor:'pointer'}} onClick={()=>setFeedback(null)}>CONFIRMAR</button>
          </div>
        )}

        {/* ITEM EM FALTA */}
        {tela==='coleta' && feedback==='item_falta' && (
          <div style={{...estilos.overlay,backgroundColor:'white',flexDirection:'column',border:'1px solid #ff7e1a'}}>
            <header style={{backgroundColor:'#ff7e1a',padding:10,textAlign:'center',color:'white'}}><h1 style={{fontSize:22,fontWeight:'bold'}}>⚠️ Item em Falta</h1></header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center'}}>
              <div style={{border:'3px solid #ff4b4b',backgroundColor:'#ffe5e5',borderRadius:10,padding:20,color:'#cc0000',fontWeight:'bold',marginBottom:30,width:'100%'}}>Não foi possível encontrar a peça no endereço.</div>
              <p style={{color:'#555',marginBottom:30,fontSize:16}}>Deseja buscar localizações alternativas no estoque?</p>
              <div style={{width:'100%',display:'flex',flexDirection:'column',gap:15}}>
                <button style={{backgroundColor:'#00c800',color:'white',border:'none',padding:18,borderRadius:12,fontWeight:'bold',fontSize:18,cursor:'pointer'}} onClick={()=>alert('Funcionalidade em desenvolvimento')}>SIM, BUSCAR ALTERNATIVA</button>
                <button style={{backgroundColor:'#5d6166',color:'white',border:'none',padding:18,borderRadius:12,fontWeight:'bold',fontSize:18,cursor:'pointer'}} onClick={pularSku}>NÃO, PULAR SKU</button>
              </div>
            </div>
          </div>
        )}

        {/* PARCIAL */}
        {feedback==='parcial' && (
          <div style={{...estilos.overlay,backgroundColor:'#ff7e1a',flexDirection:'column'}}>
            <header style={{backgroundColor:'#e66a00',padding:10,textAlign:'center',color:'white'}}><h1 style={{fontSize:20}}>⚠️ Atenção</h1></header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',color:'white'}}>
              <div style={{width:110,height:110,background:'white',border:'4px solid black',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,color:'black',fontWeight:'bold',marginBottom:20}}>!</div>
              <h2 style={{fontSize:32,marginBottom:25,lineHeight:1.1}}>Caixa com Picking Parcial</h2>
              <div style={{backgroundColor:'#fff1e6',color:'#333',border:'3px solid #ff7e1a',borderRadius:15,padding:20,width:'100%',marginBottom:20}}>
                <p style={{fontSize:18}}>Coloque esta caixa na prateleira de</p>
                <strong style={{fontSize:24,display:'block',marginTop:5}}>Caixas Abertas</strong>
              </div>
              <p style={{fontSize:16,marginBottom:40,opacity:0.9}}>A caixa poderá ser completada posteriormente</p>
              <button style={{backgroundColor:'#fff1e6',color:'#ff7e1a',border:'none',borderRadius:15,padding:20,width:'100%',fontSize:24,fontWeight:900,textTransform:'uppercase',cursor:'pointer'}} onClick={()=>{setFeedback(null);setTela('menu');}}>CONFIRMAR E SALVAR</button>
            </div>
          </div>
        )}

        {/* FINALIZADA */}
        {tela==='finalizada' && (
          <>
            <header style={{...estilos.header,backgroundColor:'#1a3a8a'}}><h1 style={{...estilos.headerH1,fontSize:24,fontWeight:900}}>CAIXA FINALIZADA!</h1></header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:30,textAlign:'center',backgroundColor:'#f8f9fa'}}>
              <div style={{width:140,height:140,backgroundColor:'white',border:'5px solid #1a3a8a',borderRadius:'50%',display:'flex',position:'relative',alignItems:'center',justifyContent:'center',fontSize:60,marginBottom:20}}>
                📦
                <div style={{position:'absolute',bottom:5,right:5,background:'#00c300',color:'white',borderRadius:'50%',width:40,height:40,fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid white'}}>✔</div>
              </div>
              <h2 style={{color:'#1a3a8a',fontSize:28,marginBottom:10}}>Tudo pronto!</h2>
              <p style={{color:'#666',fontSize:16,marginBottom:30}}>A caixa foi selada e registrada com sucesso.</p>
              <div style={{width:'100%',background:'white',border:'1px solid #ddd',borderRadius:15,padding:15,marginBottom:40}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee',fontSize:18}}><span>Itens:</span><strong>{resumo.itens}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:18}}><span>Peças:</span><strong>{resumo.pecas}</strong></div>
              </div>
              <button style={{width:'100%',padding:20,backgroundColor:'#00c300',color:'white',border:'none',borderRadius:15,fontSize:20,fontWeight:'bold',textTransform:'uppercase',cursor:'pointer'}} onClick={resetarParaNovaCaixa}>INICIAR NOVA CAIXA</button>
            </div>
          </>
        )}

        {/*CONSULTAR ESTOQUE */}
        {tela === 'estoque' && (
          <>
            <header style={estilos.header}><h1 style={estilos.headerH1}>Consultar Estoque</h1></header>
            <main style={{...estilos.main, padding:16, overflowY:'auto'}}>
              {estoque.length === 0 ? (
                <div style={{textAlign:'center',color:'#888',marginTop:40}}>
                  <div style={{fontSize:48}}>📭</div>
                  <p style={{marginTop:12}}>Nenhuma caixa em aberto</p>
                </div>
              ) : estoque.map(c => (
                <div key={c.papeleta} style={{backgroundColor:'#f8f9fa',border:'2px solid #ddd',borderRadius:12,padding:16,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:'bold',fontSize:18}}>📦 {c.papeleta}</div>
                      <div style={{color:'#666',fontSize:13}}>Pedido: {c.pedido}</div>
                    </div>
                    <span style={{backgroundColor: c.status==='parcial' ? '#ff7e1a' : '#00c300', color:'white',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:'bold'}}>
                      {labelStatus[c.status]}
                    </span>
                  </div>
                  {c.itens.map(item => (
                    <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderTop:'1px solid #eee',fontSize:14}}>
                      <span style={{color:'#333'}}>{item.ref} — {item.cor} — {item.tam}</span>
                      <span style={{fontWeight:'bold',color: item.qtd_coletada >= item.qtd ? '#00c300' : '#ff7e1a'}}>{item.qtd_coletada}/{item.qtd}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button style={{...estilos.btnCancelar, marginTop:16}} onClick={() => setTela('menu')}>← VOLTAR</button>
            </main>
          </>
        )}

        {/*INVENTÁRIO*/}
        {tela === 'inventario' && !caixaSelecionada && (
          <>
            <header style={{...estilos.header, backgroundColor:'#6f42c1'}}><h1 style={estilos.headerH1}>Inventário</h1></header>
            <main style={{...estilos.main, padding:16, overflowY:'auto'}}>
              {inventario.length === 0 ? (
                <div style={{textAlign:'center',color:'#888',marginTop:40}}>
                  <div style={{fontSize:48}}>📋</div>
                  <p style={{marginTop:12}}>Nenhuma caixa finalizada</p>
                </div>
              ) : inventario.map(c => (
                <button key={c.papeleta} onClick={() => setCaixaSelecionada(c)}
                  style={{width:'100%',backgroundColor:'white',border:'2px solid #6f42c1',borderRadius:12,padding:16,marginBottom:12,textAlign:'left',cursor:'pointer'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:'bold',fontSize:18,color:'#1a3a8a'}}>📦 {c.papeleta}</div>
                      <div style={{color:'#666',fontSize:13}}>Pedido: {c.pedido} — {c.itens.length} SKUs</div>
                    </div>
                    <span style={{backgroundColor:'#1a3a8a',color:'white',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:'bold'}}>Finalizada ✔</span>
                  </div>
                </button>
              ))}
              <button style={{...estilos.btnCancelar, marginTop:16}} onClick={() => setTela('menu')}>← VOLTAR</button>
            </main>
          </>
        )}

        {/* DETALHE CAIXA FINALIZADA NO INVENTÁRIO */}
        {tela === 'inventario' && caixaSelecionada && (
          <>
            <header style={{...estilos.header,backgroundColor:'#1a3a8a'}}><h1 style={{...estilos.headerH1,fontSize:24,fontWeight:900}}>CAIXA FINALIZADA!</h1></header>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:30,textAlign:'center',backgroundColor:'#f8f9fa',overflowY:'auto'}}>
              <div style={{width:140,height:140,backgroundColor:'white',border:'5px solid #1a3a8a',borderRadius:'50%',display:'flex',position:'relative',alignItems:'center',justifyContent:'center',fontSize:60,marginBottom:20}}>
                📦
                <div style={{position:'absolute',bottom:5,right:5,background:'#00c300',color:'white',borderRadius:'50%',width:40,height:40,fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid white'}}>✔</div>
              </div>
              <h2 style={{color:'#1a3a8a',fontSize:24,marginBottom:4}}>Caixa {caixaSelecionada.papeleta}</h2>
              <p style={{color:'#666',fontSize:14,marginBottom:20}}>Pedido: {caixaSelecionada.pedido}</p>
              <div style={{width:'100%',background:'white',border:'1px solid #ddd',borderRadius:15,padding:15,marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee',fontSize:18}}><span>SKUs:</span><strong>{caixaSelecionada.itens.length}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:18}}><span>Peças:</span><strong>{caixaSelecionada.itens.reduce((a,i)=>a+i.qtd,0)}</strong></div>
              </div>
              <div style={{width:'100%',background:'white',border:'1px solid #ddd',borderRadius:15,padding:15,marginBottom:20}}>
                {caixaSelecionada.itens.map(item => (
                  <div key={item.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee',fontSize:14}}>
                    <span>{item.ref} — {item.cor} — {item.tam}</span>
                    <span style={{color:'#00c300',fontWeight:'bold'}}>✔ {item.qtd}</span>
                  </div>
                ))}
              </div>
              <button style={{width:'100%',padding:16,backgroundColor:'#6f42c1',color:'white',border:'none',borderRadius:15,fontSize:18,fontWeight:'bold',cursor:'pointer'}} onClick={() => setCaixaSelecionada(null)}>← VOLTAR</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const estilos = {
  body: { backgroundColor:'#00c3ff', display:'flex', justifyContent:'center', alignItems:'flex-start', width:'100vw', height:'100dvh', overflow:'hidden' },
  container: { backgroundColor:'white', width:'100%', maxWidth:480, height:'100dvh', border:'none', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' },
  header: { backgroundColor:'#00c3ff', padding:15, textAlign:'center', width:'100%' },
  headerH1: { color:'white', fontSize:20, fontWeight:'normal', textTransform:'uppercase', margin:0 },
  main: { padding:20, display:'flex', flexDirection:'column', flex:1, width:'100%' },
  label: { color:'#333', fontSize:15, fontWeight:'bold', marginTop:15, marginBottom:5, display:'block' },
  inputRow: { display:'flex', gap:8, alignItems:'center', width:'100%' },
  input: { flex:1, padding:15, border:'1px solid #777', borderRadius:8, marginBottom:10, backgroundColor:'white', color:'#333', fontSize:18, outline:'none' },
  btnCam: { padding:'10px 14px', backgroundColor:'#00c3ff', color:'white', border:'none', borderRadius:8, fontSize:22, cursor:'pointer', marginBottom:10, flexShrink:0 },
  btnEntrar: { width:'100%', padding:15, border:'none', borderRadius:8, fontSize:18, textTransform:'uppercase', fontWeight:'bold', cursor:'pointer', marginTop:'auto', marginBottom:20, backgroundColor:'#00c3ff', color:'white' },
  btnMenu: { width:'100%', padding:15, backgroundColor:'#f0f0f0', border:'1px solid #ccc', borderRadius:8, fontSize:16, color:'#333', cursor:'pointer', textAlign:'center' },
  btnCancelar: { width:'100%', padding:20, border:'none', borderRadius:8, fontSize:18, textTransform:'uppercase', fontWeight:'bold', cursor:'pointer', marginBottom:10, backgroundColor:'#ff4d4d', color:'white' },
  btnConfirmar: { width:'100%', padding:20, border:'none', borderRadius:8, fontSize:18, textTransform:'uppercase', fontWeight:'bold', cursor:'pointer', marginBottom:10, backgroundColor:'#00c300', color:'white' },
  btnColeta: { width:'100%', padding:15, border:'none', borderRadius:10, color:'white', fontWeight:'bold', fontSize:18, textTransform:'uppercase', cursor:'pointer' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', maxWidth:480, height:'100%', zIndex:999, display:'flex' },
};
