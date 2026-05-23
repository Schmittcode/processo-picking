import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { papeleta, codigo_peca, operador, item_id } = await request.json();
    const sql = getDb();

    // Verifica se a peça já foi bipada
    const jaLida = await sql`
      SELECT * FROM bipagens WHERE papeleta = ${papeleta} AND codigo_peca = ${codigo_peca}
    `;
    if (jaLida.length > 0) {
      return Response.json({ success: false, tipo: 'sem_saldo', message: 'Peça sem saldo - já bipada' });
    }

    // Verifica se a peça pertence a este item
    const item = await sql`SELECT * FROM itens_picking WHERE id = ${item_id}`;
    if (item.length === 0) {
      return Response.json({ success: false, tipo: 'sku_errada', message: 'SKU não pertence à caixa' });
    }

    // Registra a bipagem
    await sql`
      INSERT INTO bipagens (papeleta, codigo_peca, operador) VALUES (${papeleta}, ${codigo_peca}, ${operador})
    `;

    // Atualiza qtd coletada
    await sql`
      UPDATE itens_picking SET qtd_coletada = qtd_coletada + 1 WHERE id = ${item_id}
    `;

    const itemAtualizado = await sql`SELECT * FROM itens_picking WHERE id = ${item_id}`;
    const completo = itemAtualizado[0].qtd_coletada >= itemAtualizado[0].qtd;

    return Response.json({ success: true, completo, item: itemAtualizado[0] });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
