export type Category =
  | "Alimentação"
  | "Transporte"
  | "Lazer"
  | "Assinaturas"
  | "Outros";
export type MonthKey = "jun" | "jul" | "ago";
export type Period = MonthKey | "quarter";

export type Transaction = {
  name: string;
  raw: string;
  date: string;
  detail: string;
  category: Category;
  amount: number;
};

// Ordem fixa: a rosca e todas as legendas seguem esta ordem, então cada
// categoria tem sempre a mesma cor.
export const categories: { name: Category; color: string }[] = [
  { name: "Alimentação", color: "#D4652C" },
  { name: "Transporte", color: "#00907B" },
  { name: "Lazer", color: "#6A58C4" },
  { name: "Assinaturas", color: "#B07E05" },
  { name: "Outros", color: "#3A78B4" },
];

export const demo: Record<
  MonthKey,
  {
    label: string;
    values: Record<Category, number>;
    transactions: Transaction[];
  }
> = {
  jun: {
    label: "Junho",
    values: {
      Alimentação: 1248.4,
      Transporte: 688.6,
      Lazer: 492,
      Assinaturas: 179.7,
      Outros: 367.3,
    },
    transactions: [
      { name: "99", raw: "99APP *CORRIDA", date: "30 jun", detail: "Corrida", category: "Transporte", amount: 21.29 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "30 jun", detail: "Compra à vista", category: "Alimentação", amount: 12.72 },
      { name: "Livraria Página", raw: "LIVRARIA PAGINA", date: "27 jun", detail: "Compra à vista", category: "Lazer", amount: 89.90 },
      { name: "Farmácia Central", raw: "FARMACIA CENTRAL 01", date: "25 jun", detail: "Compra à vista", category: "Outros", amount: 67.01 },
      { name: "Papelaria Horizonte", raw: "PAPELARIA HORIZONTE", date: "24 jun", detail: "Compra à vista", category: "Outros", amount: 32.50 },
      { name: "99", raw: "99APP *CORRIDA", date: "24 jun", detail: "Corrida", category: "Transporte", amount: 26.51 },
      { name: "Loja Casa & Cia", raw: "CASAECIA*LOJA", date: "23 jun", detail: "Compra à vista", category: "Outros", amount: 89.37 },
      { name: "99", raw: "99APP *CORRIDA", date: "23 jun", detail: "Corrida", category: "Transporte", amount: 27.35 },
      { name: "99", raw: "99APP *CORRIDA", date: "22 jun", detail: "Corrida", category: "Transporte", amount: 19.56 },
      { name: "Boliche Strike", raw: "BOLICHE STRIKE", date: "21 jun", detail: "Compra à vista", category: "Lazer", amount: 97.75 },
      { name: "iFood", raw: "IFD*IFOOD", date: "21 jun", detail: "Pedido por aplicativo", category: "Alimentação", amount: 58.70 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "19 jun", detail: "Compra à vista", category: "Alimentação", amount: 32.39 },
      { name: "99", raw: "99APP *CORRIDA", date: "19 jun", detail: "Corrida", category: "Transporte", amount: 17.13 },
      { name: "Mercado da Vila", raw: "MERCADODAVILA*LJ02", date: "18 jun", detail: "Compra à vista", category: "Alimentação", amount: 248.90 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "17 jun", detail: "Pedágio", category: "Transporte", amount: 11.29 },
      { name: "Livraria Página", raw: "LIVRARIA PAGINA", date: "16 jun", detail: "Compra à vista", category: "Lazer", amount: 61.36 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "16 jun", detail: "Compra à vista", category: "Alimentação", amount: 49.01 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "16 jun", detail: "Compra à vista", category: "Alimentação", amount: 21.29 },
      { name: "iFood", raw: "IFD*IFOOD", date: "15 jun", detail: "Pedido por aplicativo", category: "Alimentação", amount: 46.51 },
      { name: "Uber", raw: "UBER *TRIP", date: "15 jun", detail: "Corrida", category: "Transporte", amount: 36.40 },
      { name: "Nuvem Arquivos", raw: "NUVEMARQUIVOS*PLANO", date: "15 jun", detail: "Assinatura mensal", category: "Assinaturas", amount: 13.00 },
      { name: "Barbearia Navalha", raw: "BARBEARIA NAVALHA", date: "14 jun", detail: "Serviço", category: "Outros", amount: 55.86 },
      { name: "iFood", raw: "IFD*IFOOD", date: "14 jun", detail: "Pedido por aplicativo", category: "Alimentação", amount: 38.95 },
      { name: "Posto Avenida", raw: "POSTO AVENIDA LTDA", date: "13 jun", detail: "Combustível", category: "Transporte", amount: 192.98 },
      { name: "Açougue Boi Bom", raw: "ACOUGUE BOI BOM", date: "13 jun", detail: "Compra à vista", category: "Alimentação", amount: 96.13 },
      { name: "Estacionamento Centro", raw: "ESTAC CENTRO", date: "13 jun", detail: "Estacionamento", category: "Transporte", amount: 31.92 },
      { name: "Cinema Lumière", raw: "CINEMA LUMIERE", date: "12 jun", detail: "Ingressos", category: "Lazer", amount: 76.00 },
      { name: "Estacionamento Centro", raw: "ESTAC CENTRO", date: "12 jun", detail: "Estacionamento", category: "Transporte", amount: 22.29 },
      { name: "Bar do Porto", raw: "BAR DO PORTO", date: "11 jun", detail: "Compra à vista", category: "Lazer", amount: 103.80 },
      { name: "Netflix", raw: "NETFLIX.COM", date: "10 jun", detail: "Assinatura mensal", category: "Assinaturas", amount: 44.90 },
      { name: "Papelaria Horizonte", raw: "PAPELARIA HORIZONTE", date: "10 jun", detail: "Compra à vista", category: "Outros", amount: 37.96 },
      { name: "Uber", raw: "UBER *TRIP", date: "10 jun", detail: "Corrida", category: "Transporte", amount: 18.27 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "09 jun", detail: "Compra à vista", category: "Alimentação", amount: 39.24 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "09 jun", detail: "Compra à vista", category: "Alimentação", amount: 17.76 },
      { name: "Mercado da Vila", raw: "MERCADODAVILA*LJ02", date: "08 jun", detail: "Compra à vista", category: "Alimentação", amount: 231.94 },
      { name: "Spotify", raw: "SPOTIFY", date: "08 jun", detail: "Assinatura mensal", category: "Assinaturas", amount: 21.90 },
      { name: "Açougue Boi Bom", raw: "ACOUGUE BOI BOM", date: "06 jun", detail: "Compra à vista", category: "Alimentação", amount: 117.54 },
      { name: "Feira do Bairro", raw: "FEIRA DO BAIRRO", date: "06 jun", detail: "Compra à vista", category: "Alimentação", amount: 92.40 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "06 jun", detail: "Pedágio", category: "Transporte", amount: 14.88 },
      { name: "Academia Movimento", raw: "ACADEMIA MOVIMENTO", date: "05 jun", detail: "Mensalidade", category: "Assinaturas", amount: 99.90 },
      { name: "Farmácia Central", raw: "FARMACIA CENTRAL 01", date: "04 jun", detail: "Compra à vista", category: "Outros", amount: 84.60 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "04 jun", detail: "Compra à vista", category: "Alimentação", amount: 31.30 },
      { name: "Posto Avenida", raw: "POSTO AVENIDA LTDA", date: "03 jun", detail: "Combustível", category: "Transporte", amount: 180.00 },
      { name: "iFood", raw: "IFD*IFOOD", date: "03 jun", detail: "Pedido por aplicativo", category: "Alimentação", amount: 46.07 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "03 jun", detail: "Compra à vista", category: "Alimentação", amount: 25.68 },
      { name: "Cinema Lumière", raw: "CINEMA LUMIERE", date: "02 jun", detail: "Ingressos", category: "Lazer", amount: 63.19 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "01 jun", detail: "Compra à vista", category: "Alimentação", amount: 41.87 },
      { name: "Uber", raw: "UBER *TRIP", date: "01 jun", detail: "Corrida", category: "Transporte", amount: 38.89 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "01 jun", detail: "Pedágio", category: "Transporte", amount: 18.84 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "01 jun", detail: "Pedágio", category: "Transporte", amount: 11.00 },
    ],
  },
  jul: {
    label: "Julho",
    values: {
      Alimentação: 1375.2,
      Transporte: 572.8,
      Lazer: 624.5,
      Assinaturas: 179.7,
      Outros: 458.8,
    },
    transactions: [
      { name: "Loja Casa & Cia", raw: "CASAECIA*LOJA", date: "29 jul", detail: "Compra à vista", category: "Outros", amount: 99.05 },
      { name: "iFood", raw: "IFD*IFOOD", date: "29 jul", detail: "Pedido por aplicativo", category: "Alimentação", amount: 44.57 },
      { name: "Uber", raw: "UBER *TRIP", date: "28 jul", detail: "Corrida", category: "Transporte", amount: 45.12 },
      { name: "Livraria Página", raw: "LIVRARIA PAGINA", date: "28 jul", detail: "Compra à vista", category: "Lazer", amount: 42.11 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "28 jul", detail: "Compra à vista", category: "Alimentação", amount: 25.74 },
      { name: "iFood", raw: "IFD*IFOOD", date: "27 jul", detail: "Pedido por aplicativo", category: "Alimentação", amount: 74.00 },
      { name: "Lavanderia Bolha", raw: "LAVANDERIA BOLHA", date: "27 jul", detail: "Serviço", category: "Outros", amount: 53.46 },
      { name: "Hotel Serra Azul", raw: "HOTELSERRAAZUL PARC 01/03", date: "26 jul", detail: "Parcela 1 de 3", category: "Lazer", amount: 186.00 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "26 jul", detail: "Compra à vista", category: "Alimentação", amount: 25.22 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "24 jul", detail: "Pedágio", category: "Transporte", amount: 16.74 },
      { name: "Mercado da Vila", raw: "MERCADODAVILA*LJ02", date: "23 jul", detail: "Compra à vista", category: "Alimentação", amount: 312.70 },
      { name: "Restaurante Sabor Caseiro", raw: "SABOR CASEIRO REST", date: "22 jul", detail: "Compra à vista", category: "Alimentação", amount: 43.67 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "21 jul", detail: "Compra à vista", category: "Alimentação", amount: 20.99 },
      { name: "99", raw: "99APP *CORRIDA", date: "19 jul", detail: "Corrida", category: "Transporte", amount: 28.50 },
      { name: "Farmácia Central", raw: "FARMACIA CENTRAL 01", date: "18 jul", detail: "Compra à vista", category: "Outros", amount: 47.80 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "18 jul", detail: "Compra à vista", category: "Alimentação", amount: 44.59 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "18 jul", detail: "Compra à vista", category: "Alimentação", amount: 38.07 },
      { name: "99", raw: "99APP *CORRIDA", date: "18 jul", detail: "Corrida", category: "Transporte", amount: 34.37 },
      { name: "Cinema Lumière", raw: "CINEMA LUMIERE", date: "17 jul", detail: "Ingressos", category: "Lazer", amount: 74.76 },
      { name: "Teatro Municipal", raw: "TEATRO MUNICIPAL", date: "16 jul", detail: "Ingressos", category: "Lazer", amount: 110.00 },
      { name: "Açougue Boi Bom", raw: "ACOUGUE BOI BOM", date: "16 jul", detail: "Compra à vista", category: "Alimentação", amount: 89.06 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "15 jul", detail: "Compra à vista", category: "Alimentação", amount: 48.77 },
      { name: "Nuvem Arquivos", raw: "NUVEMARQUIVOS*PLANO", date: "15 jul", detail: "Assinatura mensal", category: "Assinaturas", amount: 13.00 },
      { name: "Posto Avenida", raw: "POSTO AVENIDA LTDA", date: "14 jul", detail: "Combustível", category: "Transporte", amount: 188.21 },
      { name: "Lavanderia Bolha", raw: "LAVANDERIA BOLHA", date: "14 jul", detail: "Serviço", category: "Outros", amount: 36.88 },
      { name: "Farmácia Central", raw: "FARMACIA CENTRAL 01", date: "12 jul", detail: "Compra à vista", category: "Outros", amount: 75.88 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "11 jul", detail: "Compra à vista", category: "Alimentação", amount: 38.60 },
      { name: "Netflix", raw: "NETFLIX.COM", date: "10 jul", detail: "Assinatura mensal", category: "Assinaturas", amount: 44.90 },
      { name: "Uber", raw: "UBER *TRIP", date: "09 jul", detail: "Corrida", category: "Transporte", amount: 35.94 },
      { name: "Papelaria Horizonte", raw: "PAPELARIA HORIZONTE", date: "09 jul", detail: "Compra à vista", category: "Outros", amount: 21.26 },
      { name: "Posto Avenida", raw: "POSTO AVENIDA LTDA", date: "08 jul", detail: "Combustível", category: "Transporte", amount: 195.00 },
      { name: "Açougue Boi Bom", raw: "ACOUGUE BOI BOM", date: "08 jul", detail: "Compra à vista", category: "Alimentação", amount: 101.16 },
      { name: "iFood", raw: "IFD*IFOOD", date: "08 jul", detail: "Pedido por aplicativo", category: "Alimentação", amount: 57.51 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "08 jul", detail: "Compra à vista", category: "Alimentação", amount: 41.58 },
      { name: "Spotify", raw: "SPOTIFY", date: "08 jul", detail: "Assinatura mensal", category: "Assinaturas", amount: 21.90 },
      { name: "Cinema Lumière", raw: "CINEMA LUMIERE", date: "06 jul", detail: "Ingressos", category: "Lazer", amount: 73.56 },
      { name: "Academia Movimento", raw: "ACADEMIA MOVIMENTO", date: "05 jul", detail: "Mensalidade", category: "Assinaturas", amount: 99.90 },
      { name: "Bar do Porto", raw: "BAR DO PORTO", date: "05 jul", detail: "Compra à vista", category: "Lazer", amount: 79.26 },
      { name: "Papelaria Horizonte", raw: "PAPELARIA HORIZONTE", date: "05 jul", detail: "Compra à vista", category: "Outros", amount: 69.40 },
      { name: "Barbearia Navalha", raw: "BARBEARIA NAVALHA", date: "05 jul", detail: "Serviço", category: "Outros", amount: 55.07 },
      { name: "iFood", raw: "IFD*IFOOD", date: "04 jul", detail: "Pedido por aplicativo", category: "Alimentação", amount: 71.20 },
      { name: "99", raw: "99APP *CORRIDA", date: "04 jul", detail: "Corrida", category: "Transporte", amount: 28.92 },
      { name: "Boliche Strike", raw: "BOLICHE STRIKE", date: "03 jul", detail: "Compra à vista", category: "Lazer", amount: 58.81 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "03 jul", detail: "Compra à vista", category: "Alimentação", amount: 55.60 },
      { name: "Mercado da Vila", raw: "MERCADODAVILA*LJ02", date: "02 jul", detail: "Compra à vista", category: "Alimentação", amount: 218.62 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "01 jul", detail: "Compra à vista", category: "Alimentação", amount: 23.55 },
    ],
  },
  ago: {
    label: "Agosto",
    values: {
      Alimentação: 1186.7,
      Transporte: 734.3,
      Lazer: 418.5,
      Assinaturas: 179.7,
      Outros: 393.8,
    },
    transactions: [
      { name: "Café e Livros", raw: "CAFEELIVROS", date: "31 ago", detail: "Compra à vista", category: "Lazer", amount: 40.21 },
      { name: "99", raw: "99APP *CORRIDA", date: "30 ago", detail: "Corrida", category: "Transporte", amount: 32.55 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "30 ago", detail: "Pedágio", category: "Transporte", amount: 14.45 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "29 ago", detail: "Compra à vista", category: "Alimentação", amount: 23.29 },
      { name: "Mercado da Vila", raw: "MERCADODAVILA*LJ02", date: "28 ago", detail: "Compra à vista", category: "Alimentação", amount: 170.92 },
      { name: "99", raw: "99APP *CORRIDA", date: "28 ago", detail: "Corrida", category: "Transporte", amount: 34.36 },
      { name: "99", raw: "99APP *CORRIDA", date: "28 ago", detail: "Corrida", category: "Transporte", amount: 33.12 },
      { name: "Feira do Bairro", raw: "FEIRA DO BAIRRO", date: "27 ago", detail: "Compra à vista", category: "Alimentação", amount: 168.30 },
      { name: "Estacionamento Centro", raw: "ESTAC CENTRO", date: "27 ago", detail: "Estacionamento", category: "Transporte", amount: 25.84 },
      { name: "Lavanderia Bolha", raw: "LAVANDERIA BOLHA", date: "26 ago", detail: "Serviço", category: "Outros", amount: 37.28 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "26 ago", detail: "Compra à vista", category: "Alimentação", amount: 17.99 },
      { name: "Bar do Porto", raw: "BAR DO PORTO", date: "25 ago", detail: "Compra à vista", category: "Lazer", amount: 104.82 },
      { name: "Açougue Boi Bom", raw: "ACOUGUE BOI BOM", date: "25 ago", detail: "Compra à vista", category: "Alimentação", amount: 98.44 },
      { name: "Boliche Strike", raw: "BOLICHE STRIKE", date: "25 ago", detail: "Compra à vista", category: "Lazer", amount: 84.10 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "24 ago", detail: "Compra à vista", category: "Alimentação", amount: 32.85 },
      { name: "Farmácia Central", raw: "FARMACIA CENTRAL 01", date: "22 ago", detail: "Compra à vista", category: "Outros", amount: 54.30 },
      { name: "Uber", raw: "UBER *TRIP", date: "21 ago", detail: "Corrida", category: "Transporte", amount: 42.80 },
      { name: "Pedágio Rodovia Sul", raw: "PEDAGIO RODOVIA SUL", date: "21 ago", detail: "Pedágio", category: "Transporte", amount: 12.39 },
      { name: "Papelaria Horizonte", raw: "PAPELARIA HORIZONTE", date: "20 ago", detail: "Compra à vista", category: "Outros", amount: 19.10 },
      { name: "Café e Livros", raw: "CAFEELIVROS", date: "18 ago", detail: "Compra à vista", category: "Lazer", amount: 58.50 },
      { name: "Café Central", raw: "CAFE CENTRAL", date: "17 ago", detail: "Compra à vista", category: "Alimentação", amount: 23.99 },
      { name: "Livraria Página", raw: "LIVRARIA PAGINA", date: "16 ago", detail: "Compra à vista", category: "Lazer", amount: 54.87 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "16 ago", detail: "Compra à vista", category: "Alimentação", amount: 30.33 },
      { name: "99", raw: "99APP *CORRIDA", date: "15 ago", detail: "Corrida", category: "Transporte", amount: 35.37 },
      { name: "Nuvem Arquivos", raw: "NUVEMARQUIVOS*PLANO", date: "15 ago", detail: "Assinatura mensal", category: "Assinaturas", amount: 13.00 },
      { name: "Mercado da Vila", raw: "MERCADODAVILA*LJ02", date: "14 ago", detail: "Compra à vista", category: "Alimentação", amount: 247.90 },
      { name: "Uber", raw: "UBER *TRIP", date: "14 ago", detail: "Corrida", category: "Transporte", amount: 25.13 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "13 ago", detail: "Compra à vista", category: "Alimentação", amount: 46.88 },
      { name: "Uber", raw: "UBER *TRIP", date: "13 ago", detail: "Corrida", category: "Transporte", amount: 26.97 },
      { name: "Posto Avenida", raw: "POSTO AVENIDA LTDA", date: "12 ago", detail: "Combustível", category: "Transporte", amount: 210.00 },
      { name: "Restaurante Sabor Caseiro", raw: "SABOR CASEIRO REST", date: "12 ago", detail: "Compra à vista", category: "Alimentação", amount: 74.81 },
      { name: "Uber", raw: "UBER *TRIP", date: "12 ago", detail: "Corrida", category: "Transporte", amount: 25.94 },
      { name: "Estacionamento Centro", raw: "ESTAC CENTRO", date: "12 ago", detail: "Estacionamento", category: "Transporte", amount: 20.65 },
      { name: "Estacionamento Centro", raw: "ESTAC CENTRO", date: "12 ago", detail: "Estacionamento", category: "Transporte", amount: 13.47 },
      { name: "Loja Casa & Cia", raw: "CASAECIA*LOJA", date: "10 ago", detail: "Compra à vista", category: "Outros", amount: 101.37 },
      { name: "Netflix", raw: "NETFLIX.COM", date: "10 ago", detail: "Assinatura mensal", category: "Assinaturas", amount: 44.90 },
      { name: "iFood", raw: "IFD*IFOOD", date: "09 ago", detail: "Pedido por aplicativo", category: "Alimentação", amount: 63.40 },
      { name: "Spotify", raw: "SPOTIFY", date: "08 ago", detail: "Assinatura mensal", category: "Assinaturas", amount: 21.90 },
      { name: "Hortifruti Verde", raw: "HORTIFRUTI VERDE", date: "07 ago", detail: "Compra à vista", category: "Alimentação", amount: 40.46 },
      { name: "Posto Avenida", raw: "POSTO AVENIDA LTDA", date: "06 ago", detail: "Combustível", category: "Transporte", amount: 161.08 },
      { name: "Academia Movimento", raw: "ACADEMIA MOVIMENTO", date: "05 ago", detail: "Mensalidade", category: "Assinaturas", amount: 99.90 },
      { name: "Cinema Lumière", raw: "CINEMA LUMIERE", date: "05 ago", detail: "Ingressos", category: "Lazer", amount: 76.00 },
      { name: "Açougue Boi Bom", raw: "ACOUGUE BOI BOM", date: "05 ago", detail: "Compra à vista", category: "Alimentação", amount: 70.47 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "05 ago", detail: "Compra à vista", category: "Alimentação", amount: 34.81 },
      { name: "99", raw: "99APP *CORRIDA", date: "05 ago", detail: "Corrida", category: "Transporte", amount: 20.18 },
      { name: "Pet Shop Amigo", raw: "PETSHOP AMIGO", date: "03 ago", detail: "Compra à vista", category: "Outros", amount: 96.70 },
      { name: "Padaria Estrela", raw: "PADARIA ESTRELA", date: "03 ago", detail: "Compra à vista", category: "Alimentação", amount: 41.86 },
      { name: "Farmácia Central", raw: "FARMACIA CENTRAL 01", date: "01 ago", detail: "Compra à vista", category: "Outros", amount: 85.05 },
    ],
  },
};

export const monthKeys: MonthKey[] = ["jun", "jul", "ago"];

/** Formata um valor em reais, por exemplo "R$ 1.248,40". */
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
