import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const caixas = await sql`SELECT * FROM caixas WHERE status = 'finalizada' ORDER BY criado_em DESC`;
    const itens = await sql`SELECT * FROM itens_picking ORDER BY id`;

    const resultado = caixas.map(c => ({
      ...c,
      itens: itens.filter(i => i.papeleta === c.papeleta)
    }));

    return new Response(JSON.stringify({ success: true, caixas: resultado }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
}