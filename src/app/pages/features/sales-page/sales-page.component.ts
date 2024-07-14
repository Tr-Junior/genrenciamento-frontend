import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ToastrService } from 'ngx-toastr';
import { PrimeNGConfig } from 'primeng/api';
import { Order } from 'src/app/models/order.models';
import { Security } from 'src/app/utils/Security.util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sales-page',
  templateUrl: './sales-page.component.html',
  styleUrls: ['./sales-page.component.css']
})
export class SalesPageComponent implements OnInit {
  public paymentTotals: PaymentTotal[] = [];
  public orders: Order[] = [];
  public busy = false;
  public rangeDates?: Date[];
  public ptBR: any;

  constructor(
    private primengConfig: PrimeNGConfig,
    private service: DataService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.ptBR = {
      firstDayOfWeek: 0,
      dayNames: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
      dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      dayNamesMin: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"],
      monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
      monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      today: 'Hoje',
      clear: 'Limpar'
    };
  }

  ngOnInit() {
    Security.clearPass();
    this.listOrders();
    this.primengConfig.setTranslation(this.ptBR);
  }

  listOrders() {
    this.busy = true; // Indica que o carregamento está em andamento
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // Verifica se rangeDates foi definido e contém datas válidas
    if (this.rangeDates && this.rangeDates.length === 2) {
      startDate = this.rangeDates[0];
      endDate = this.rangeDates[1];
    }

    this.service.getOrderByDateRange(startDate, endDate).subscribe({
      next: (data: any) => {
        this.orders = data;
        this.calculatePaymentTotals();
        this.busy = false; // Indica que o carregamento foi concluído
      },
      error: (err: any) => {
        console.error(err);
        this.toastr.error(err.message);
        this.busy = false; // Indica que o carregamento foi concluído
      }
    });
  }

  clearSearch(): void {
    this.rangeDates = [];
    this.orders = [];
    this.listOrders();
  }

  calculatePaymentTotals() {
    const paymentTotalsMap = new Map<string, number>();
    let totalSales = 0; // Variável para armazenar a soma total de todas as vendas

    const paymentClasses: { [key: string]: string } = {
      'Total': 'total',
      'Crédito': 'payment-credit',
      'Dinheiro': 'payment-cash',
      'Pix': 'payment-pix',
      'Débito': 'payment-debit'
    };

    this.orders.forEach(order => {
      const paymentMethod = order.sale.formPayment;
      const total = order.sale.total;

      totalSales += total; // Adiciona o total da venda à soma total de todas as vendas

      if (paymentTotalsMap.has(paymentMethod)) {
        paymentTotalsMap.set(paymentMethod, paymentTotalsMap.get(paymentMethod)! + total);
      } else {
        paymentTotalsMap.set(paymentMethod, total);
      }
    });

    // Adiciona a soma total de todas as vendas com a classe 'total'
    this.paymentTotals = [{ paymentMethod: 'Total', total: totalSales, className: paymentClasses['Total'] }];

    // Adiciona os totais individuais por forma de pagamento
    Array.from(paymentTotalsMap).forEach(([paymentMethod, total]) => {
      if (paymentMethod !== 'Total') {
        this.paymentTotals.push({ paymentMethod, total, className: paymentClasses[paymentMethod] || 'payment-others' });
      }
    });
  }


  async delete(id: any, code: any) {
    try {
      const data = await this.service.delOrder(id).toPromise();
      this.toastr.success(data.message, 'Venda deletada');
      await this.service.delEntrancesByCode(code).toPromise();
      this.toastr.success('Entrada deletada');
      this.listOrders(); // Atualiza a lista após a exclusão
    } catch (err: any) {
      this.toastr.error(err.message, 'Erro ao deletar venda');
    }
  }
}

export interface PaymentTotal {
  paymentMethod: string;
  total: number;
  color?: any;
  className: string; // Adicione esta linha
}

