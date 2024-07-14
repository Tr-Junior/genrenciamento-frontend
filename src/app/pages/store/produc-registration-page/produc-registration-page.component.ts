import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Product } from 'src/app/models/product.model';
import { DataService } from 'src/app/services/data.service';



@Component({
  selector: 'app-produc-registration-page',
  templateUrl: './produc-registration-page.component.html',
  styleUrls: ['./produc-registration-page.component.css']
})
export class ProducRegistrationPageComponent {
  @Input() products!: Product;
  public displayModal: boolean = false;
  public product: Product[] = [];
  public form: FormGroup;
  public busy = false;
  prodId = "";
  name: any;
  public selectedProduct: Product[] = [];
  public clonedProducts: { [s: string]: Product } = {};

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private data: DataService,
    private service: DataService,
    private router: Router,
    private fb: FormBuilder,
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
  }

  resetForm() {
    this.form.reset();
    this.fecharModal();
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

  refresh(): void {
    window.location.reload();
  }

  submit() {
    this.busy = true;
    this
      .service
      .createProduct(this.form.value)
      .subscribe({
        next: (data: any) => {
          this.busy = false;
          this.toastr.success(data.message);
          this.resetForm();
          this.listProd();
          console.log();
          this.fecharModal();
        },
        error: (err: any) => {
          console.log(err);
          this.busy = false;
        }
      }

      );
  }

  // Método para fechar o modal
  fecharModal() {
    this.displayModal = false;
  }
}
