export class CartItem {
  constructor(
    public _id: string,
    public title: string,
    public quantity: number,
    public purchasePrice: number,
    public price: number,
    public discount: number,
  ) { }


}
