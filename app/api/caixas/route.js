import { getDb } from '../../../lib/db';

export async function POST(request) {
  try {
    const { papeleta } = await request.json();
    const sql = getDb();

    const caixa = await sql`SELECT * FROM caixas WHERE papeleta = ${papeleta}`;
    if (caixa.length === 0) {
      return Response.json({ success: false, message: 'Caixa não encontrada' }, { status: 404 });
    }

    const itens = await sql`
      SELECT * FROM itens_picking WHERE papeleta = ${papeleta} ORDER BY id
    `;

    const progresso = await sql`
      SELECT * FROM progresso_caixas WHERE papeleta = ${papeleta}
    `;

    return Response.json({
      success: true,
      caixa: caixa[0],
      itens,
      progresso: progresso[0] || { item_atual: 0, pecas_no_item: 0 }
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
