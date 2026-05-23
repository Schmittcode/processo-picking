import { getDb } from '../../../../lib/db';

export async function GET() {
  try {
    const sql = getDb();
    await sql`DELETE FROM bipagens`;
    await sql`DELETE FROM progresso_caixas`;
    await sql`DELETE FROM itens_picking`;
    await sql`DELETE FROM caixas`;
    return Response.json({ message: '✅ Tudo resetado! Adicione as caixas novamente.' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
