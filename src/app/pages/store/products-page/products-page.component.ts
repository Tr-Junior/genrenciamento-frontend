import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { Product } from 'src/app/models/product.model';
import { DataService } from 'src/app/services/data.service';
import { MessageService } from 'primeng/api';
import { CartUtil } from 'src/app/utils/cart-util';
import { CartItem } from 'src/app/models/cart-item.model';
import { Security } from 'src/app/utils/Security.util';
import { User } from 'src/app/models/user.model';
import * as XLSX from 'xlsx';
import { LowStockNotificationService } from 'src/app/services/low-stok-notification.service';


@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css']
})
export class ProductsPageComponent implements OnInit {

  public products$!: Observable<Product[]>;
  public form: FormGroup;
  public busy = false;
  id: any;
  date?: Date;
  user!: User;
  prodId = "";
  name: any;
  @Input() products!: Product;
  product: Product[] = [];
  clonedProducts: { [s: string]: Product } = {};
  public selectedProduct!: Product;
  public updating: boolean = false;
  public searchQuery: string = '';
  totalPurchaseValue: number = 0;
  displayModal: boolean = false;


  constructor(
    private messageService: MessageService,
    private data: DataService,
    private service: DataService,
    private router: Router,
    private fb: FormBuilder,
    private lowStockNotificationService: LowStockNotificationService,
    private toastr: ToastrService
  ) {

    this.form = this.fb.group({
      title: ['', Validators.compose([
        Validators.required
      ])],
      quantity: ['', Validators.compose([
        Validators.required
      ])],
      min_quantity: ['', Validators.compose([
        Validators.required
      ])],
      purchasePrice: ['', Validators.compose([
        Validators.required
      ])],
      price: ['', Validators.compose([
        Validators.required
      ])]
    });
  }


  ngOnInit() {
    this.listProd();
    this.user = Security.getUser();
  }


  openModal() {
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
  }

  resetForm() {
    this.form.reset();
  }

  listProd() {
    this
      .service
      .getProduct()
      .subscribe(
        (data: any) => {
          this.busy = false;
          this.product = data;
        })
  }



  // submit() {
  //   this.busy = true;
  //   this
  //     .service
  //     .createProduct(this.form.value)
  //     .subscribe({
  //       next: (data: any) => {
  //         this.busy = false;
  //         this.toastr.success(data.message, 'Produto cadastrado');
  //         this.resetForm();
  //       },
  //       error: (err: any) => {
  //         this.toastr.error(err.message);
  //         this.busy = false;
  //       }
  //     }

  //     );
  // }

  delete(id: any) {
    this
      .service
      .delProd(id)
      .subscribe(
        (data: any) => {
          this.busy = false;
          this.toastr.success(data.message);
          this.listProd();
          console.log(data);
        },
        (err: any) => {
          this.toastr.error(err.message);
          this.busy = false;
          console.log(err);
        }

      );
  }

  onRowEditInit(product: Product) {
    this.selectedProduct = { ...product };
    this.form.controls['title'].setValue(product.title);
    this.form.controls['quantity'].setValue(product.quantity);
    this.form.controls['min_quantity'].setValue(product.min_quantity);
    this.form.controls['purchasePrice'].setValue(product.purchasePrice);
    this.form.controls['price'].setValue(product.price);
  }


  onRowEditSave(product: Product) {
    this.updating = false;
    const index = this.product.findIndex(p => p._id === product._id);
    const updatedProduct = { id: product._id, ...this.selectedProduct };
    this.service.updateProduct(updatedProduct).subscribe({
      next: (data: any) => {
        this.product[index] = data.product;
        this.toastr.success(data.message, 'Produto atualizado');
        if (this.searchQuery === '') {
          this.listProd();
        } else {
          this.search();
        }
        this.updating = true;
      },
      error: (err: any) => {
        console.log(err);
        this.toastr.error(err.message, 'Erro');
      }
    });
  }

  onRowEditCancel(product: Product) {
    const index = this.product.findIndex(p => p._id === product._id);
    this.product[index] = this.selectedProduct;
    this.selectedProduct;
    if (this.searchQuery === '') {
      this.listProd();
    } else {
      this.search();
    }
  }


  search(): void {
    if (!this.searchQuery) {
      this.listProd();
      return;
    }

    this.busy = true;

    // Crie um objeto com o campo "title" contendo o termo de pesquisa
    const searchData = { title: this.searchQuery };

    this.service.searchProduct(searchData).subscribe({
      next: (data: any) => {
        this.busy = false;
        this.product = data;
      },
      error: (err: any) => {
        console.log(err);
        this.busy = false;
        this.toastr.error(err.message);
      }
    });
  }


  addToCart(data: any): void {
    const product = this.product.find(p => p._id === data._id);
    if (product) {
      const item: CartItem = {
        _id: product._id,
        title: product.title,
        price: product.price,
        quantity: 1,
        discount: 0
      };
      const cart = CartUtil.get();
      const cartItem = cart.items.find(item => item._id === product._id);

      if (cartItem) {
        if (cartItem.quantity < product.quantity) {
          if (item.quantity > 1 && (cartItem.quantity + item.quantity) > product.quantity) {
            this.toastr.error('Quantidade solicitada maior que o estoque', 'Erro');
            return;
          }
          cartItem.quantity += item.quantity;
          this.toastr.success(data.message, 'Produto adicionado');
        } else {
          this.toastr.error('Quantidade solicitada maior que o estoque', 'Erro');
          return;
        }
      } else {
        if (item.quantity > product.quantity) {
          this.toastr.error('Quantidade solicitada maior que o estoque', 'Erro');
          return;
        }
        cart.items.push(item);
        this.toastr.success(data.message, 'Produto adicionado');
      }
      CartUtil.add(item._id, item.title, item.quantity, item.price, item.discount);
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.listProd();
  }


  exportToExcel() {
    const data = this.product.map((product: any, index: number) => {
      return {
        '#': index + 1,
        'Código': product.codigo,
        'Nome': product.title,
        'Quantidade em Estoque': product.quantity,
        'Quantidade minima em estoque': product.min_quantity,
        'Valor de Compra': product.purchasePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        'Valor de Venda': product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Definir a largura das colunas
    const columnWidths = [
      { wch: 5 },  // Largura da coluna '#'
      { wch: 25 }, // Largura da coluna 'Código'
      { wch: 35 }, // Largura da coluna 'Nome'
      { wch: 20 }, // Largura da coluna 'Quantidade em Estoque'
      { wch: 20 }, // Largura da coluna 'Quantidade minima em Estoque'
      { wch: 20 }, // Largura da coluna 'Valor de Compra'
      { wch: 20 }  // Largura da coluna 'Valor de Venda'
    ];

    // Definir a largura das colunas no objeto 'worksheet'
    worksheet['!cols'] = columnWidths;

    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'produtos');
  }



  saveAsExcelFile(buffer: any, fileName: string) {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url: string = window.URL.createObjectURL(data);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = fileName + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }


}
