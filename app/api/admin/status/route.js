import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const caixas = await sql`SELECT papeleta, pedido, status FROM caixas ORDER BY criado_em DESC`;
    const bipagens = await sql`SELECT COUNT(*) as total FROM bipagens`;
    const progresso = await sql`SELECT COUNT(*) as total FROM progresso_caixas`;

    const detalhes = caixas.map(c => `📦 ${c.papeleta} (Pedido: ${c.pedido}) — ${c.status}`).join('\n');
    return Response.json({
      message: `${caixas.length} caixa(s) | ${bipagens[0].total} bipagem(ns) | ${progresso[0].total} em progresso\n\n${detalhes}`
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
