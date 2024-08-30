
export interface SaleItem {
  product: string;
  title: string;
  quantity: number;
  price: number;
  purchasePrice: number,
  _id: string;
}
export interface PaymentMethod {
  method: string;
  amount: number;
}

export interface Sale {
  items: SaleItem[];
  discount: number;
  total: number;
  payments: PaymentMethod[]; // Atualizado para "payments" em vez de "formPayment"
}

export interface Order {
  sale: Sale;
  customer: {
    _id: string;
    name: string;
  };
  number: string;
  createDate: Date;
  client: string;
  _id: string; // Inclua o ID aqui se necessário
}
