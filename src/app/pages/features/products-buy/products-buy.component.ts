import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SelectItem } from 'primeng/api';
import { ProductsBuy } from 'src/app/models/productsBuy-model';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-products-buy',
  templateUrl: './products-buy.component.html',
  styleUrls: ['./products-buy.component.css']
})
export class ProductsBuyComponent implements OnInit {
  public productsBuy: ProductsBuy[] = [];
  public busy = false;
  public status: SelectItem[] = [];
  public form: FormGroup;

  constructor(
    private service: DataService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.status = this.getStatus().map(option => ({ label: option, value: option })).sort((a, b) => a.label.localeCompare(b.label));
    this.form = this.fb.group({
      title: ['', Validators.compose([
        Validators.required
      ])],
      status: ['A fazer', Validators.compose([
        Validators.required
      ])],

    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  getStatus(): string[] {
    return ['A fazer', 'Pedido feito'];
  }

  loadProducts() {
    this.busy = true;
    this.service.getProductBuy().subscribe(
      (data: any) => {
        this.busy = false;
        this.productsBuy = data;
      },
      error => {
        this.busy = false;
        this.toastr.error('Erro ao carregar produtos.');
      }
    );
  }

  submitForm() {
    if (this.form.valid) {
      this.submit();
    }
  }

  submit() {
    this.busy = true;
    this.service.createProductBuy(this.form.value).subscribe({
      next: (data: any) => {
        this.busy = false;
        this.toastr.success(data.message);
        this.resetForm();
        this.loadProducts();
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.busy = false;
        if (err.status === 400 && err.error.message) {
          this.toastr.error(err.error.message);
        } else {
          this.toastr.error('Erro ao salvar o produto.');
        }
      }
    });
  }

  resetForm() {
    this.form.reset();
  }

  onEdit(event: any, product: ProductsBuy) {
    console.log('Produto antes do envio:', product);

    const updatedProduct = {
      id: product._id,
      title: product.title,
      status: product.status
    };

    this.service.updateProductBuy(updatedProduct).subscribe(
      () => {
        this.toastr.success('Produto atualizado com sucesso.');
        this.loadProducts();
      },
      error => {
        this.toastr.error('Erro ao atualizar produto.');
        console.error('Erro de atualização:', error);
      }
    );
  }

  deleteProduct(id: any) {
    this
    .service
    .delProductBuy(id)
    .subscribe(
      (data: any) => {
        this.busy = false;
        this.toastr.success(data.message,'Produto deletado com sucesso.');
        this.loadProducts();
      },
      error => {
        this.toastr.error('Erro ao deletar produto.');
      }
    );
  }
}
