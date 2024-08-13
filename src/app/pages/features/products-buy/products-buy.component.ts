import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MessageService, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { Product } from 'src/app/models/product.model';
import { ProductsBuy } from 'src/app/models/productsBuy-model';
import { DataService } from 'src/app/services/data.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  selectedProducts: any[] = [];
  metaKeySelection: boolean = false;
  public searchQuery: string = '';


  constructor(
    private service: DataService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private messageService: MessageService
  ) {
    this.status = this.getStatus().map(option => ({ label: option, value: option })).sort((a, b) => a.label.localeCompare(b.label));
    this.form = this.fb.group({
      title: ['', Validators.compose([
        Validators.required
      ])],
    });
  }

  onRowEditInit(product: any) {
    this.messageService.add({ severity: 'info', summary: 'Edição de tabela iniciada', detail: product.title });
  }

  onRowEditSave(product: any) {
    console.log('Produto antes do envio:', product);

    const updatedProduct = {
      id: product._id,
      title: product.title,
      status: product.status
    };

    this.service.updateProductBuy(updatedProduct).subscribe(
      () => {
        this.loadProducts();
        this.toastr.success('Produto atualizado com sucesso.');
      },
      error => {
        this.toastr.error('Erro ao atualizar produto.');
        console.error('Erro de atualização:', error);
      }
    );
  }

  onRowEditCancel(product: any, index: number) {
    this.messageService.add({ severity: 'warn', summary: 'Edição cancelada', detail: product.title });
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
        this.productsBuy = data.sort((a: any, b: any) => {
          const statusComparison = a.status.toLowerCase().localeCompare(b.status.toLowerCase());
          if (statusComparison !== 0) {
            return statusComparison;
          }
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        this.busy = false;
      },
      error => {
        this.toastr.error('Erro ao carregar produtos.');
        this.busy = false;
      }
    );
  }

  submitForm() {
    if (this.form.valid) {
      this.submit();
    }
  }

  submit(): void {
  if (this.form.valid) {
    this.busy = true;

    // Adiciona o status "A fazer" aos valores do formulário
    const formValue = {
      ...this.form.value,
      status: 'A fazer'
    };

    this.service.createProductBuy(formValue).subscribe({
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
}


  resetForm() {
    this.form.reset();
  }

  onEdit(event: any, product: ProductsBuy) {
    console.log('Produto antes do envio:', product);

    const updatedProduct = {
      id: product._id,
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
  deselectAll(): void {
    this.selectedProducts = [];
  }

  search(): void {
    if (!this.searchQuery) {
      this.loadProducts();
      return;
    }
    // Crie um objeto com o campo "title" contendo o termo de pesquisa
    const searchData = { title: this.searchQuery };

    this.service.searchProductBuy(searchData).subscribe({
      next: (data: any) => {
        this.productsBuy = data;
      },
      error: (err: any) => {
        console.log(err);
        this.toastr.error(err.message);
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadProducts();
  }


  nome = 'Manancial papelaria e utilidades - xerox e impressões';
  endereco = 'Quadra 10, lote 36, loja 01 Jardim Guaíra I - Águas Lindas de Goiás';
  telefone = '(61) 99581-0812';
  cnpj = '52.068.148/0001-61';

  generatePDF(nome: string, endereco: string, telefone: string, cnpj: any): void {
    const doc = new jsPDF();

    // Informações de endereço, telefone e CNPJ
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const enderecoText = `Endereço: ${endereco}`;
    const enderecoWidth = doc.getTextWidth(enderecoText);
    const enderecoX = (doc.internal.pageSize.getWidth() - enderecoWidth) / 2;
    doc.text(enderecoText, enderecoX, 20);

    const telefoneText = `Telefone: ${telefone}`;
    const telefoneWidth = doc.getTextWidth(telefoneText);
    const telefoneX = (doc.internal.pageSize.getWidth() - telefoneWidth) / 2;
    doc.text(telefoneText, telefoneX, 25);

    doc.text(`CNPJ: ${cnpj}`, telefoneX, 30);

    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
    doc.text(`Data e Hora: ${formattedDate}`, 133, 44);

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(10, 45, doc.internal.pageSize.getWidth() - 10, 45);

    const headers = [['Produto', 'Status']];
    const tableY = 55;

    const tableData = this.productsBuy.map(product => [
      product.title,
      product.status
    ]);

    autoTable(doc, {
      startY: tableY,
      head: headers,
      body: tableData,
      styles: {
        halign: 'center',
        fontSize: 10,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [54, 162, 235],
        textColor: [255, 255, 255],
        fontSize: 12,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 95 },
      }
    });

    doc.setFontSize(10);
    doc.text('Agradecemos a preferência!', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

    doc.save('produtos.pdf');
  }

}
