import { Cart } from "../models/cart-model";
import { CartItem } from "../models/cart-item.model";

export class CartUtil {
  public static get(): Cart {
    // Recupera os dados do LocalStorage
    const data = localStorage.getItem('shopcart');

    // Caso não haja dados, retorna um novo carrinho
    if (!data)
      return new Cart();

    // Caso haja dados, retorna o carrinho
    return JSON.parse(data);
  }

  public static add(
    _id: string,
    title: string,
    quantity: number,
    price: number,
    discount: number,
  ) {
    // Obtém o carrinho
    let cart = this.get();

    // Gera o novo item
    const item = new CartItem(_id, title, quantity, discount, price);
    // Adiciona ao carrinho

    const existingItemIndex = cart.items.findIndex(i => i._id === item._id);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    // Salva no localStorage
    this.update(cart);

  }

  public static updateItem(
    _id: string,
    title: string,
    quantity: number,
    price: number,
    discount: number
  ) {
    // Obtém o carrinho
    let cart = this.get();

    // Verifica se já existe um item com o mesmo ID no carrinho
    const existingItemIndex = cart.items.findIndex(i => i._id === _id);

    if (existingItemIndex > -1) {
      // Se o item já existe, substitua a quantidade pelo novo valor
      cart.items[existingItemIndex].quantity = quantity;
      // Recalcule o valor total com desconto para o item
    } else {
      // Se o item não existe, adicione-o ao carrinho
      const item = new CartItem(_id, title, quantity, discount, price);
      // Calcula o valor total com desconto do item
      cart.items.push(item);
    }

    // Salva no localStorage
    this.update(cart);
  }


  public static addPaymentForm(paymentForm: string): void {
    let cart = this.get();
    cart.paymentForm = paymentForm;
    this.update(cart);
  };

  public static addDiscount(generalDiscount: number): void {
    let cart = this.get();
    cart.generalDiscount = generalDiscount;
    this.update(cart);
  };


  public static clear() {
    localStorage.removeItem('shopcart');

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
    localStorage.setItem('shopcart', JSON.stringify(cart));
  }

  static getQuotes(): Cart[] {
    const quotes = localStorage.getItem('quotes');
    return quotes ? JSON.parse(quotes) : [];
  }

  static saveQuote(quote: Cart): void {
    const quotes = this.getQuotes();
    quotes.push(quote);
    localStorage.setItem('quotes', JSON.stringify(quotes));
  }
}
