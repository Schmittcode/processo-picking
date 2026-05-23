import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const caixas = await sql`
      SELECT * FROM caixas 
      WHERE status = 'finalizada' 
      ORDER BY criado_em DESC
    `;

    const resultado = [];
    for (const caixa of caixas) {
      const itens = await sql`
        SELECT * FROM itens_picking WHERE papeleta = ${caixa.papeleta} ORDER BY id
      `;
      resultado.push({ ...caixa, itens });
    }

    return Response.json({ success: true, caixas: resultado });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
