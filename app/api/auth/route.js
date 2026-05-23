import { getDb } from '../../../lib/db';

export async function POST(request) {
  try {
    const { supervisor, operador } = await request.json();
    const sql = getDb();

    const sup = await sql`
      SELECT * FROM usuarios WHERE id = ${supervisor} AND tipo = 'supervisor'
    `;

    const op = await sql`
      SELECT * FROM usuarios WHERE id = ${operador}
    `;

    if (sup.length > 0 && op.length > 0) {
      return Response.json({ success: true, nome: op[0].nome });
    } else {
      return Response.json({ success: false, message: 'Credenciais inválidas' }, { status: 401 });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
