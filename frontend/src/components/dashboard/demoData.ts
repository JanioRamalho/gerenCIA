export type Category =
  | "Alimentação"
  | "Transporte"
  | "Lazer"
  | "Assinaturas"
  | "Outros";
export type MonthKey = "jun" | "jul" | "ago";
export type Period = MonthKey | "quarter";

type Transaction = {
  name: string;
  detail: string;
  category: Category;
  amount: number;
};

export const categories: { name: Category; color: string }[] = [
  { name: "Alimentação", color: "#F2A16B" },
  { name: "Transporte", color: "#42B9AD" },
  { name: "Lazer", color: "#9889D9" },
  { name: "Assinaturas", color: "#E8BA53" },
  { name: "Outros", color: "#7299A8" },
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
      {
        name: "Mercado da Vila",
        detail: "18 jun · Compra no débito",
        category: "Alimentação",
        amount: 248.9,
      },
      {
        name: "Uber",
        detail: "15 jun · Mobilidade",
        category: "Transporte",
        amount: 36.4,
      },
      {
        name: "Cinema Lumière",
        detail: "12 jun · Entretenimento",
        category: "Lazer",
        amount: 76,
      },
      {
        name: "Spotify",
        detail: "08 jun · Cobrança recorrente",
        category: "Assinaturas",
        amount: 21.9,
      },
      {
        name: "Farmácia Central",
        detail: "04 jun · Compra no débito",
        category: "Outros",
        amount: 84.6,
      },
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
      {
        name: "Mercado da Vila",
        detail: "23 jul · Compra no débito",
        category: "Alimentação",
        amount: 312.7,
      },
      {
        name: "99",
        detail: "19 jul · Mobilidade",
        category: "Transporte",
        amount: 28.5,
      },
      {
        name: "Teatro Municipal",
        detail: "16 jul · Entretenimento",
        category: "Lazer",
        amount: 110,
      },
      {
        name: "Netflix",
        detail: "10 jul · Cobrança recorrente",
        category: "Assinaturas",
        amount: 44.9,
      },
      {
        name: "Papelaria Horizonte",
        detail: "05 jul · Compra no débito",
        category: "Outros",
        amount: 69.4,
      },
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
      {
        name: "Feira do Bairro",
        detail: "27 ago · Compra no débito",
        category: "Alimentação",
        amount: 168.3,
      },
      {
        name: "Uber",
        detail: "21 ago · Mobilidade",
        category: "Transporte",
        amount: 42.8,
      },
      {
        name: "Café e Livros",
        detail: "18 ago · Entretenimento",
        category: "Lazer",
        amount: 58.5,
      },
      {
        name: "Spotify",
        detail: "08 ago · Cobrança recorrente",
        category: "Assinaturas",
        amount: 21.9,
      },
      {
        name: "Pet Shop Amigo",
        detail: "03 ago · Compra no débito",
        category: "Outros",
        amount: 96.7,
      },
    ],
  },
};

export const monthKeys: MonthKey[] = ["jun", "jul", "ago"];
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
