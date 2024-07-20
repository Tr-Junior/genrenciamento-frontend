
export interface SaleItem {
  product: string;
  title: string;
  quantity: number;
  price: number;
  purchasePrice: number,
  _id: string;
}
export interface Order {
  sale: {
    items: SaleItem[];
    discount: number;
    total: number;
    formPayment: string;
  };
  customer: string;
  number: string;
  createDate: Date;
}
export interface PaymentTotal {
  formPayment: string;
  color: any;
  total: number;
}
