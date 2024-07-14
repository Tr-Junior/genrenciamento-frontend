import { CartItem } from "./cart-item.model";

export class Cart {
  items: CartItem[] = [];
  paymentForm?: string;
  generalDiscount?: number = 0;
  total?: number;
  customerName?: string;

  constructor() {
    this.items = [];
    this.paymentForm = '';
  }
}
