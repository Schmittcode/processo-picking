import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { papeleta, operador, item_atual, pecas_no_item, finalizada } = await request.json();
    const sql = getDb();

    if (finalizada) {
      await sql`UPDATE caixas SET status = 'finalizada', operador = ${operador} WHERE papeleta = ${papeleta}`;
      await sql`DELETE FROM progresso_caixas WHERE papeleta = ${papeleta}`;
    } else {
      await sql`
        INSERT INTO progresso_caixas (papeleta, item_atual, pecas_no_item)
        VALUES (${papeleta}, ${item_atual}, ${pecas_no_item})
        ON CONFLICT (papeleta) DO UPDATE SET item_atual = ${item_atual}, pecas_no_item = ${pecas_no_item}, atualizado_em = NOW()
      `;
      await sql`UPDATE caixas SET status = 'parcial', operador = ${operador} WHERE papeleta = ${papeleta}`;
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
