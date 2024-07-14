export class Product {
  constructor(
    public _id: string,
    public codigo: string,
    public title: string,
    public quantity: number,
    public min_quantity: number,
    public discount: number,
    public purchasePrice: number,
    public price: number
  ) { }
}
