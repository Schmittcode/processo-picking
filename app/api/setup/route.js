import { getDb } from '../../../lib/db';

export async function GET() {
  try {
    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        senha TEXT,
        nome TEXT,
        tipo TEXT DEFAULT 'operador'
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS caixas (
        papeleta TEXT PRIMARY KEY,
        pedido TEXT,
        status TEXT DEFAULT 'aberta',
        operador TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS itens_picking (
        id SERIAL PRIMARY KEY,
        papeleta TEXT,
        ref TEXT,
        cor TEXT,
        tam TEXT,
        endereco TEXT,
        qtd INTEGER,
        qtd_coletada INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pendente'
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bipagens (
        id SERIAL PRIMARY KEY,
        papeleta TEXT,
        codigo_peca TEXT,
        operador TEXT,
        bipado_em TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS progresso_caixas (
        papeleta TEXT PRIMARY KEY,
        item_atual INTEGER DEFAULT 0,
        pecas_no_item INTEGER DEFAULT 0,
        atualizado_em TIMESTAMP DEFAULT NOW()
      )
    `;

    // Inserir dados de teste se não existirem
    const users = await sql`SELECT * FROM usuarios LIMIT 1`;
    if (users.length === 0) {
      await sql`INSERT INTO usuarios VALUES ('SUPERVISOR01', '1234', 'Supervisor Teste', 'supervisor')`;
      await sql`INSERT INTO usuarios VALUES ('OP001', '5678', 'Operador Teste', 'operador')`;

      // Caixa de teste
      await sql`INSERT INTO caixas (papeleta, pedido, status) VALUES ('06772401', '2657808', 'aberta')`;

      // Itens de teste para a caixa
      await sql`INSERT INTO itens_picking (papeleta, ref, cor, tam, endereco, qtd) VALUES
        ('06772401', '1000079', 'ÚNICO', '18', 'A02.01.4A', 2),
        ('06772401', '200045', 'AZUL', 'M', 'C37.09.6B', 3),
        ('06772401', '300012', 'BRANCO', 'P', 'B15.03.2C', 1)
      `;
    }

    return Response.json({ success: true, message: 'Banco de dados configurado!' });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
