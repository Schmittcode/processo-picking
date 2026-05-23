import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { papeleta, codigo_peca, operador, item_id } = await request.json();
    const sql = neon(process.env.DATABASE_URL);

    // Verifica se já foi bipada
    const jaLida = await sql`
      SELECT * FROM bipagens WHERE papeleta = ${papeleta} AND codigo_peca = ${codigo_peca}
    `;
    if (jaLida.length > 0) {
      return Response.json({ success: false, tipo: 'sem_saldo', message: 'Peça sem saldo' });
    }

    // Busca o item atual
    const item = await sql`SELECT * FROM itens_picking WHERE id = ${item_id} AND papeleta = ${papeleta}`;
    if (item.length === 0) {
      return Response.json({ success: false, tipo: 'sku_errada', message: 'SKU não pertence à caixa' });
    }

    // Normaliza removendo acentos e caracteres especiais para comparar
    function normalizar(str) {
      return str.toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '');
    }

    const codigoNorm = normalizar(codigo_peca);
    const refNorm = normalizar(item[0].ref);

    // Só valida a referência — evita problemas com acentos em cor/tamanho
    if (!codigoNorm.includes(refNorm)) {
      return Response.json({ success: false, tipo: 'sku_errada', message: 'SKU não pertence à caixa' });
    }

    // Registra
    await sql`INSERT INTO bipagens (papeleta, codigo_peca, operador) VALUES (${papeleta}, ${codigo_peca}, ${operador})`;
    await sql`UPDATE itens_picking SET qtd_coletada = qtd_coletada + 1 WHERE id = ${item_id}`;

    const itemAtualizado = await sql`SELECT * FROM itens_picking WHERE id = ${item_id}`;
    const completo = itemAtualizado[0].qtd_coletada >= itemAtualizado[0].qtd;

    return Response.json({ success: true, completo, item: itemAtualizado[0] });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}