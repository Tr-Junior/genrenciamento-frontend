import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class LowStockNotificationService {
  private lowStockProducts = new BehaviorSubject<Product[]>([]);

  lowStockProducts$ = this.lowStockProducts.asObservable();

  setLowStockProducts(products: Product[]) {
    this.lowStockProducts.next(products);
  }
}
