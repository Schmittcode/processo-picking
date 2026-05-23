import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const caixas = await sql`
      SELECT * FROM caixas 
      WHERE status IN ('aberta', 'parcial') 
      ORDER BY criado_em DESC
    `;

    const resultado = [];
    for (const caixa of caixas) {
      const itens = await sql`
        SELECT * FROM itens_picking 
        WHERE papeleta = ${caixa.papeleta} 
        ORDER BY id
      `;
      // Calcula progresso geral da caixa
      const totalQtd = itens.reduce((a, i) => a + i.qtd, 0);
      const totalColetado = itens.reduce((a, i) => a + i.qtd_coletada, 0);
      resultado.push({ ...caixa, itens, totalQtd, totalColetado });
    }

    return Response.json({ success: true, caixas: resultado });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
