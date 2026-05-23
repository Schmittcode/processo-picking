import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const caixas = await sql`SELECT * FROM caixas WHERE status = 'finalizada' ORDER BY criado_em DESC`;
    const itens = await sql`SELECT * FROM itens_picking ORDER BY id`;

    const resultado = caixas.map(c => ({
      ...c,
      itens: itens.filter(i => i.papeleta === c.papeleta)
    }));

    return Response.json({ success: true, caixas: resultado });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
