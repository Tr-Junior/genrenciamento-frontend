import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ToastrService } from 'ngx-toastr';
import { PrimeNGConfig } from 'primeng/api';
import { Order } from 'src/app/models/order.models';
import { Security } from 'src/app/utils/Security.util';
import { Router } from '@angular/router';
import { Product } from 'src/app/models/product.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  public product: Product[] = [];


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
    this.listProd();
    this.primengConfig.setTranslation(this.ptBR);
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
    let estimatedProfitTotal = 0; // Variável para armazenar a soma total do lucro estimado

    const paymentClasses: { [key: string]: string } = {
      'Crédito': 'payment-credit',
      'Dinheiro': 'payment-cash',
      'Pix': 'payment-pix',
      'Débito': 'payment-debit',
      'Total': 'total'
    };

    this.orders.forEach(order => {
      const paymentMethod = order.sale.formPayment;
      const total = order.sale.total;

      totalSales += total; // Adiciona o total da venda à soma total de todas as vendas

      // Calcula o lucro estimado para cada item da venda
      order.sale.items.forEach(item => {
        const itemProfit = (item.price * item.quantity) - (item.purchasePrice * item.quantity);
        estimatedProfitTotal += itemProfit;
      });

      if (paymentTotalsMap.has(paymentMethod)) {
        paymentTotalsMap.set(paymentMethod, paymentTotalsMap.get(paymentMethod)! + total);
      } else {
        paymentTotalsMap.set(paymentMethod, total);
      }
    });

    // Inicializa paymentTotals como um array vazio
    this.paymentTotals = [];

    // Adiciona os totais individuais por forma de pagamento
    Array.from(paymentTotalsMap).forEach(([paymentMethod, total]) => {
      this.paymentTotals.push({ paymentMethod, total, className: paymentClasses[paymentMethod] || 'payment-others' });
    });

    // Adiciona a soma total de todas as vendas com a classe 'total'
    this.paymentTotals.push({ paymentMethod: 'Total', total: totalSales, className: paymentClasses['Total'] });

    // Adiciona o lucro estimado total com a classe 'total'
    this.paymentTotals.push({ paymentMethod: 'Lucro Estimado Total', total: estimatedProfitTotal, className: 'total' });
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

  logo = 'assets/image/logo2.png'; // Adicione aqui a string base64 da sua imagem
  nome = '';
  endereco = '';
  telefone = '';
  cnpj = '';

  generatePDF(logo: string, name: string, endereco: string, telefone: string, cnpj: string) {
    const doc = new jsPDF();

    // Adiciona a logo centralizada
    const logoWidth = 150;
    const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2;
    doc.addImage(logo, 'PNG', logoX, 8, logoWidth, 45);

    // Título do relatório
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Vendas', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

    // // Informações de contato
    // doc.setFontSize(12);
    // doc.setFont('helvetica', 'normal');
    // doc.text(`Nome: ${name}`, 10, 60);
    // doc.text(`Endereço: ${endereco}`, 10, 70);
    // doc.text(`Telefone: ${telefone}`, 10, 80);
    // doc.text(`CNPJ: ${cnpj}`, 10, 90);

    // // Data e Hora local
    // const currentDate = new Date();
    // const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
    // doc.text(`Data e Hora: ${formattedDate}`, 10, 100);

    // Linha de separação
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(10, 105, doc.internal.pageSize.getWidth() - 10, 105);

    // Totais por forma de pagamento centralizados e lado a lado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Totais por Forma de Pagamento:', doc.internal.pageSize.getWidth() / 2, 115, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    let y = 125;
    let paymentTotalTextLine1 = '';
    let paymentTotalTextLine2 = '';
    const halfLength = Math.ceil(this.paymentTotals.length / 2);

    this.paymentTotals.slice(0, halfLength).forEach(paymentTotal => {
      paymentTotalTextLine1 += `${paymentTotal.paymentMethod}: R$ ${paymentTotal.total.toFixed(2)}    `;
  });

  this.paymentTotals.slice(halfLength).forEach(paymentTotal => {
      paymentTotalTextLine2 += `${paymentTotal.paymentMethod}: R$ ${paymentTotal.total.toFixed(2)}    `;
  });

  doc.text(paymentTotalTextLine1, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 6;
  doc.text(paymentTotalTextLine2, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 6;

    // Linha de separação antes das vendas
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(10, y, doc.internal.pageSize.getWidth() - 10, y);
    y += 2;

    // Adiciona a tabela de vendas e itens juntos
    this.orders.forEach(order => {
        if (y > doc.internal.pageSize.height - 50) {
            doc.addPage();
            y = 10;
        }

        const saleDetailsHeaders = ['Número da Venda', 'Data da Venda', 'Forma de Pagamento', 'Valor Total'];
        const saleDetailsData = [
            [
                order.number,
                new Date(order.createDate).toLocaleString(), // Converte a data para string
                order.sale.formPayment,
                `R$ ${order.sale.total.toFixed(2)}`
            ]
        ];

        autoTable(doc, {
            startY: y,
            head: [saleDetailsHeaders],
            body: saleDetailsData,
            styles: {
                halign: 'center',
                fontSize: 10,
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [54, 162, 235],
                textColor: [255, 255, 255],
                fontSize: 12,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 50 },
                2: { cellWidth: 50 },
                3: { cellWidth: 40 }
            },
            tableWidth: 'wrap', // Ajusta a largura da tabela para o conteúdo
            margin: { left: (doc.internal.pageSize.getWidth() - 190) / 2 }, // Centraliza a tabela
            didDrawPage: function (data) {
                y = data.cursor?.y || y;
            }
        });

        y += 1; // Diminui o espaçamento entre tabelas

        const itemHeaders = ['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total', 'Lucro Estimado'];
        const itemData = order.sale.items.map(item => {
            const estimatedProfit = (item.price - item.purchasePrice) * item.quantity;
            return [
                item.title,
                item.quantity.toString(),
                `R$ ${item.price.toFixed(2)}`,
                `R$ ${(item.price * item.quantity).toFixed(2)}`,
                `R$ ${estimatedProfit.toFixed(2)}`
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [itemHeaders],
            body: itemData,
            styles: {
                halign: 'center',
                fontSize: 10,
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [54, 162, 235],
                textColor: [255, 255, 255],
                fontSize: 12,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 30 },
                2: { cellWidth: 35 },
                3: { cellWidth: 35 },
                4: { cellWidth: 40 }
            },
            tableWidth: 'wrap', // Ajusta a largura da tabela para o conteúdo
            margin: { left: (doc.internal.pageSize.getWidth() - 185) / 2 }, // Centraliza a tabela
            didDrawPage: function (data) {
                y = data.cursor?.y || y;
            }
        });

        y += (itemData.length * 8) + 2; // Diminui o espaçamento entre tabelas
    });

    // Salva o PDF
    doc.save('relatorio_vendas.pdf');
}

}

export interface PaymentTotal {
  paymentMethod: string;
  total: number;
  color?: any;
  className: string; // Adicione esta linha
}

