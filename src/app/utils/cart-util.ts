import { Cart } from "../models/cart-model";
import { CartItem } from "../models/cart-item.model"; // Ajuste o caminho conforme necessário
import { Security } from "./Security.util";

export class CartUtil {
  private static getUserKey(): string {
    const user = Security.getUser();
    if (!user || !user._id) {
      throw new Error("Usuário não autenticado");
    }
    return `shopcart_${user._id}`;
  }

  public static get(): Cart {
    const data = sessionStorage.getItem(this.getUserKey());
    if (!data) return new Cart();
    return JSON.parse(data);
  }

  public static add(
    _id: string,
    title: string,
    quantity: number,
    price: number,
    purchasePrice: number,
    discount: number,
  ) {
    let cart = this.get();
    const item = new CartItem(_id, title, quantity, discount, price, purchasePrice);
    const existingItemIndex = cart.items.findIndex(i => i._id === item._id);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    this.update(cart);
  }

  public static updateItem(
    _id: string,
    title: string,
    quantity: number,
    price: number,
    purchasePrice: number,
    discount: number
  ) {
    let cart = this.get();
    const existingItemIndex = cart.items.findIndex(i => i._id === _id);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = quantity;
    } else {
      const item = new CartItem(_id, title, quantity, discount, price, purchasePrice);
      cart.items.push(item);
    }
    this.update(cart);
  }

  public static addPaymentForm(paymentForm: string): void {
    let cart = this.get();
    cart.paymentForm = paymentForm;
    this.update(cart);
  }

  public static addDiscount(generalDiscount: number): void {
    let cart = this.get();
    cart.generalDiscount = generalDiscount;
    this.update(cart);
  }
  public static addCustomerName(customerName: string): void {
    let cart = this.get();
    cart.customerName = customerName;
    this.update(cart);
  }

  public static clear() {
    sessionStorage.removeItem(this.getUserKey());
  }

  public static getItems(): CartItem[] {
    return this.get().items;
  }

  public static removeItem(item: CartItem): void {
    let cart = this.get();
    const index = cart.items.findIndex(i => i._id === item._id);
    if (index > -1) {
      cart.items.splice(index, 1);
    }
    this.update(cart);
  }

  public static getSubtotal(): number {
    return this.getItems().reduce((total, item) => {
      if (item.discount != 0) {
        return total;
      } else {
        return total + (item.quantity * item.price);
      }
    }, 0);
  }

  public static getTotal(): number {
    return this.getItems().reduce((total, item) => {
      return (item.quantity * item.price) - ((item.quantity * item.price) * item.discount / 100);
    }, 0);
  }

  public static getGrandTotal(): number {
    const cart = this.get();
    const subtotal = this.getSubtotal();
    return subtotal - (subtotal * cart.generalDiscount! / 100);
  }

  private static update(cart: Cart) {
    sessionStorage.setItem(this.getUserKey(), JSON.stringify(cart));
  }
}
