import { getDb } from '../../../../lib/db';

const caixas = {
  1: {
    papeleta: '06772401', pedido: '2657808',
    itens: [
      { ref: '1000079', cor: 'ÚNICO', tam: '18', endereco: 'A02.01.4A', qtd: 2 },
      { ref: '200045',  cor: 'AZUL',  tam: 'M',  endereco: 'C37.09.6B', qtd: 3 },
      { ref: '300012',  cor: 'BRANCO',tam: 'P',  endereco: 'B15.03.2C', qtd: 1 },
    ]
  },
  2: {
    papeleta: '09912345', pedido: '3301122',
    itens: [
      { ref: '400088', cor: 'VERDE',    tam: 'G',  endereco: 'D10.02.1A', qtd: 2 },
      { ref: '500011', cor: 'AMARELO',  tam: 'P',  endereco: 'A05.07.3B', qtd: 3 },
      { ref: '600033', cor: 'VERMELHO', tam: 'M',  endereco: 'C22.04.2C', qtd: 1 },
      { ref: '700055', cor: 'ROSA',     tam: 'GG', endereco: 'B08.01.4A', qtd: 2 },
    ]
  },
  3: {
    papeleta: '11100999', pedido: '4412233',
    itens: [
      { ref: '800077', cor: 'PRETO', tam: 'M',  endereco: 'E03.05.1B', qtd: 2 },
      { ref: '900099', cor: 'CINZA', tam: 'GG', endereco: 'F12.08.3C', qtd: 2 },
    ]
  }
};

export async function POST(request) {
  try {
    const { numero } = await request.json();
    const sql = getDb();
    const c = caixas[numero];
    if (!c) return Response.json({ error: 'Caixa inválida' }, { status: 400 });

    // Remove dados antigos desta caixa
    await sql`DELETE FROM itens_picking WHERE papeleta = ${c.papeleta}`;
    await sql`DELETE FROM progresso_caixas WHERE papeleta = ${c.papeleta}`;
    await sql`DELETE FROM bipagens WHERE papeleta = ${c.papeleta}`;
    await sql`DELETE FROM caixas WHERE papeleta = ${c.papeleta}`;

    // Insere caixa
    await sql`INSERT INTO caixas (papeleta, pedido, status) VALUES (${c.papeleta}, ${c.pedido}, 'aberta')`;

    // Insere itens
    for (const item of c.itens) {
      await sql`INSERT INTO itens_picking (papeleta, ref, cor, tam, endereco, qtd) 
                VALUES (${c.papeleta}, ${item.ref}, ${item.cor}, ${item.tam}, ${item.endereco}, ${item.qtd})`;
    }

    return Response.json({ message: `✅ Caixa ${c.papeleta} pronta! ${c.itens.length} SKUs adicionadas.` });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
