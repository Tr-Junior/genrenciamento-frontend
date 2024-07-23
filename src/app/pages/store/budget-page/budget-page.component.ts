import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from 'src/app/services/data.service';
import { CartUtil } from 'src/app/utils/cart-util';
import { Security } from 'src/app/utils/Security.util';
import { Budget } from 'src/app/models/budget-model';
import { CartItem } from 'src/app/models/cart-item.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-budget-page',
  templateUrl: './budget-page.component.html',
  styleUrls: ['./budget-page.component.css']
})
export class BudgetPageComponent implements OnInit {

  public cartItems: any[] = [];
  public products: any[] = [];
  public subtotal: number = 0;
  public grandTotal: number = 0;
  public generalDiscount: number = 0;
  public busy = false;
  public budgets: Budget[] = [];  // Adicionado para armazenar os orçamentos
  public customerName: string = '';

  constructor(
    private toastr: ToastrService,
    private service: DataService
  ) { }

  ngOnInit() {
    this.loadCart();
    this.listBudget();  // Carregar os orçamentos ao iniciar o componente
  }

  loadCart() {
    const cart = CartUtil.get();
    this.cartItems = cart.items;
    this.subtotal = CartUtil.getSubtotal();
    this.grandTotal = CartUtil.getGrandTotal();
    this.generalDiscount = cart.generalDiscount ?? 0;
  }



  listBudget() {
    this.busy = true;
    this.service.getBudget().subscribe({
      next: (data: Budget[]) => {
        this.busy = false;
        this.budgets = data;
      },
      error: (err: any) => {
        console.log(err);
        this.busy = false;
        this.toastr.error(err.message);
      }
    });
  }

  calculateTotalO(items: any[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  removeBudget(index: number) {
    const budget = this.budgets[index];
    this.service.delBudget(budget._id).subscribe({
      next: () => {
        this.budgets.splice(index, 1);
        this.toastr.success('Orçamento removido com sucesso');
      },
      error: (err: any) => {
        console.log(err);
        this.toastr.error(err.message);
      }
    });
  }

  async addBudgetToCart(budget: any) {
    // Obtém os itens do orçamento
    const items = budget.budget.items;

    // Para cada item do orçamento, faça uma solicitação ao servidor para obter os detalhes do produto
    for (const item of items) {
      try {
        // Faça uma solicitação ao servidor para obter os detalhes do produto usando o ID do produto
        const productDetails = await this.service.getProductById(item.product).toPromise();

        // Verifica se o produto foi encontrado
        if (!productDetails) {
          return;
        }

        // Cria um objeto CartItem com os detalhes do produto
        const cartItem: CartItem = {
          _id: productDetails._id,
          title: productDetails.title,
          price: productDetails.price,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          discount: 0,
        };

        // Adiciona o item ao carrinho no localStorage
        CartUtil.add(cartItem._id, cartItem.title, cartItem.quantity, cartItem.price, cartItem.discount , cartItem.purchasePrice);
      } catch (error) {
        console.error('Erro ao obter detalhes do produto:', error);
        this.toastr.error('Erro ao adicionar item ao carrinho', 'Erro');
        return; // Retorna para evitar adicionar itens duplicados ao carrinho em caso de erro
      }
    }

    // Remove o orçamento após adicionar todos os itens ao carrinho
    this.removeBudget(this.budgets.indexOf(budget));

    // Exibe uma mensagem de sucesso
    this.toastr.success('Orçamento adicionado ao carrinho!', 'Sucesso');
  }

  logo = 'assets/image/logo2.png'; // Adicione aqui a string base64 da sua imagem
  nome = 'Manancial';
  endereco = 'Qd 33 Conj "B" N° 01-A setor 2  -  Águas Lindas de Goiás';
  telefone = '(61) 99571-0019';
  cnpj = '52.068.148/0001-61';

  generatePDFForBudget(budget: Budget): void {
    const doc = new jsPDF();

    // Adiciona a logo centralizada
    const logoWidth = 100; // largura da logo
    const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2; // posição X centralizada
    doc.addImage(this.logo, 'JPEG', logoX, 5, logoWidth, 30);

    // Informações de endereço, telefone e CNPJ com ícones centralizados
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const infoX = 45; // posição X das informações
    doc.text(`Endereço: ${this.endereco}`, infoX, 40);
    doc.text(`Telefone: ${this.telefone}`, infoX, 50);
    doc.text(`CNPJ: ${this.cnpj}`, infoX + 70, 50); // adiciona 70 para espaçamento entre telefone e CNPJ

    // Obtém a data e hora local
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

    // Adiciona a data e hora local abaixo do CNPJ
    doc.text(`Data e Hora: ${formattedDate}`, 133, 69);

    // Linha de separação estilizada centralizada
    const lineY = 70; // posição Y da linha
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0); // Cor preta
    doc.line(10, lineY, doc.internal.pageSize.getWidth() - 10, lineY); // começa na margem esquerda e termina na margem direita

    // Cabeçalhos da tabela
    const headers = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
    const tableWidth = doc.internal.pageSize.getWidth() - 28; // largura da tabela
    const tableHeight = (doc.internal.pageSize.getHeight() - lineY - 20); // altura da tabela (disponível após a linha de separação e margens superior e inferior)
    const tableY = lineY + 10; // posição Y da tabela (10 para espaçamento)

    // Calcula o valor total dos itens
    let totalValue = 0;
    budget.budget.items.forEach(item => {
        totalValue += item.price * item.quantity;
    });

    // Adiciona os itens do orçamento à tabela de dados e calcula o valor total
    const tableData = budget.budget.items.map(item => [
        item.title,
        item.quantity,
        `R$ ${item.price.toFixed(2)}`,
        `R$ ${(item.price * item.quantity).toFixed(2)}`
    ]);

    // Adiciona uma linha para o valor total ao final da tabela
    const totalRow = ['-', '-', 'Total:', `R$ ${totalValue.toFixed(2)}`];
    tableData.push(totalRow);

    // Adiciona a tabela ao documento PDF usando autoTable
    autoTable(doc, {
        startY: tableY,
        head: headers,
        body: tableData,
        styles: {
            halign: 'center', // Centraliza o texto nas células
            fontSize: 10, // Tamanho da fonte nas células
            textColor: [0, 0, 0], // Cor do texto
            lineColor: [0, 0, 0], // Cor das bordas
            lineWidth: 0.1 // Largura das bordas
        },
        headStyles: {
            fillColor: [54, 162, 235], // Cor de fundo dos cabeçalhos
            textColor: [255, 255, 255], // Cor do texto dos cabeçalhos
            fontSize: 12, // Tamanho da fonte dos cabeçalhos
            halign: 'center' // Alinhamento do texto dos cabeçalhos
        },
        columnStyles: {
            0: { cellWidth: tableWidth * 0.25 }, // Ajusta a largura da coluna 'Produto'
            1: { cellWidth: tableWidth * 0.15 }, // Ajusta a largura da coluna 'Quantidade'
            2: { cellWidth: tableWidth * 0.3 }, // Ajusta a largura da coluna 'Valor Unitário'
            3: { cellWidth: tableWidth * 0.3 }  // Ajusta a largura da coluna 'Valor Total'
        }
    });

    // Rodapé com agradecimento centralizado e valor total do caixa
    doc.setFontSize(10);
    doc.text('Agradecemos a preferência!', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

    // Salva o PDF
    doc.save('orcamento.pdf');
  }
}
