import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const sql = getDb();
    await sql`DELETE FROM bipagens`;
    await sql`DELETE FROM progresso_caixas`;
    await sql`UPDATE caixas SET status = 'aberta', operador = NULL`;
    await sql`UPDATE itens_picking SET qtd_coletada = 0, status = 'pendente'`;
    return Response.json({ message: '✅ Tudo resetado! Pronto para demonstração.' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
