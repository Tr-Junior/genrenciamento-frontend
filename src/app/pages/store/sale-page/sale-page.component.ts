import { Component, HostListener } from '@angular/core';
import { CartItem } from 'src/app/models/cart-item.model';
import { Cart } from 'src/app/models/cart-model';
import { Product } from 'src/app/models/product.model';
import { CartUtil } from 'src/app/utils/cart-util';
import { DataService } from 'src/app/services/data.service';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Security } from 'src/app/utils/Security.util';
import { User } from 'src/app/models/user.model';
import jsPDF, { RGBAData } from 'jspdf';
import { ElementRef, ViewChild } from '@angular/core';
import autoTable from 'jspdf-autotable';
import { getLocaleDateTimeFormat } from '@angular/common';
import { Budget } from 'src/app/models/budget-model';


@Component({
  selector: 'app-sale-page',
  templateUrl: './sale-page.component.html',
  styleUrls: ['./sale-page.component.css']
})
export class SalePageComponent {
  public cart: Cart = new Cart();
  public cartItems: CartItem[] = [];
  public product: Product[] = [];
  public products: Product[] = [];
  public selectedPayment?: string;
  public subtotal: number;
  public grandTotal: number;
  public itemTotal: number = 0;
  public formPayment!: string;
  public formPaymentOptions: { label: string, value: string }[];
  public generalDiscount: number = 0;
  public totalWithDiscount: number = 0;
  public busy = false;
  public form!: FormGroup;
  public searchQuery: string = '';
  public searching: boolean = false;
  public user!: User;
  public total: any;
  public totalTroco = 0;
  public quotes: Cart[] = [];
  public customerName: string = '';  // Adiciona
  public filteredCustomers: string[] = [];
  public customerNames: string[] = [];
  creditPercentage: number = 0;
  debitPercentage: number = 0;
  public paymentMethods: { method: string, amount: number }[] = [];

  constructor(
    private toastr: ToastrService,
    private service: DataService
  ) {
    this.grandTotal = CartUtil.getGrandTotal();
    this.formPaymentOptions = this.getPaymentMethods().map(option => ({ label: option, value: option }));
    this.selectedPayment = CartUtil.get().paymentForm;

    // this.itemTotal = this.cart.itemTotalWithDiscount
    this.subtotal = CartUtil.getSubtotal();
    this.generalDiscount = this.cart.generalDiscount ?? 0;
    this.grandTotal = CartUtil.getGrandTotal();
  }

  currencySettings = {
    mode: 'decimal',
    locale: 'pt-BR',
    prefix: 'R$ ',
    decimalSeparator: ',',
    thousandSeparator: '.'
  };

  ngOnInit() {
    this.loadCart();
    this.listProdSilent();
    this.user = Security.getUser();
    this.calculateTotal(); // Carregar orçamentos salvos na inicialização
    this.loadCustomerNames();
    this.loadPercentages();
  }

  loadCart() {
    this.cart = CartUtil.get();
    this.cartItems = this.cart.items;
    this.subtotal = CartUtil.getSubtotal();
    this.grandTotal = CartUtil.getGrandTotal();
    this.generalDiscount = this.cart.generalDiscount ?? 0;
  }

  listProdSilent() {
    this.busy = true;
    this.service.getProduct().subscribe({
      next: (data: any) => {
        this.busy = false;
        this.products = data;
      },
      error: (err: any) => {
        console.log(err);
        this.busy = false;
        this.toastr.error(err.message);
      }
    });
  }

  addToCart(data: any): void {
    const product = this.products.find(p => p._id === data._id);

    if (!product) {
      return;
    }

    const item: CartItem = {
      _id: product._id,
      title: product.title,
      price: product.price,
      purchasePrice: product.purchasePrice,
      quantity: 1,
      discount: 0,
    };

    const cart = CartUtil.get();
    const cartItem = cart.items.find(item => item._id === product._id);
    const requestedQuantity = cartItem ? cartItem.quantity + item.quantity : item.quantity;

    if (cartItem && requestedQuantity > product.quantity) {
      this.toastr.error('Quantidade solicitada maior que o estoque', 'Erro');
      return;
    }

    if (!cartItem && item.quantity > product.quantity) {
      this.toastr.error('Quantidade solicitada maior que o estoque', 'Erro');
      return;
    }

    if (cartItem) {
      cartItem.quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    this.toastr.success(data.message, 'Produto adicionado');
    CartUtil.add(item._id, item.title, item.quantity, item.price, item.discount, item.purchasePrice);
    this.loadCart();
    this.clearSearch();
  }



  calculateTotal() {
    this.subtotal = CartUtil.getSubtotal();
    this.grandTotal = CartUtil.getGrandTotal();
    this.calcTroco();
  }


  updateGeneralDiscount(generalDiscount: number): void {
    CartUtil.addDiscount(generalDiscount);
    this.generalDiscount = generalDiscount;
    this.grandTotal = CartUtil.getGrandTotal();
  }

  updateQuantity(newQuantity: number, item: CartItem) {
    // Verifica se a nova quantidade é menor ou igual a zero
    if (newQuantity <= 0) {
      this.toastr.error('Quantidade inválida', 'Erro');
      return;
    }

    // Verifica se o produto existe no estoque
    const product = this.products.find(p => p._id === item._id);
    if (!product) {
      this.toastr.error('Produto não encontrado no estoque', 'Erro');
      return;
    }

    // Calcula a quantidade disponível no estoque
    const availableQuantity = product.quantity;

    // Atualiza a quantidade para o máximo entre zero e a quantidade disponível no estoque
    const updatedQuantity = Math.min(newQuantity, availableQuantity);

    // Exibe uma mensagem de aviso se a quantidade digitada for maior que a disponível em estoque
    if (updatedQuantity < newQuantity) {
      this.toastr.warning(`Quantidade em estoque ${availableQuantity}`, 'Aviso');
    }

    // Atualiza a quantidade do item no carrinho com o novo valor ajustado
    item.quantity = updatedQuantity;

    // Atualiza o item no carrinho no local storage
    CartUtil.updateItem(item._id, item.title, item.quantity, item.price, item.discount, item.purchasePrice);

    // Recalcula o total após a atualização da quantidade
    this.calculateTotal();
  }

  remove(data: any): void {
    CartUtil.removeItem(data);
    this.loadCart();
    this.toastr.success(data.message, 'Produto removido do carrinho');
    this.cartItems = CartUtil.getItems();
    this.subtotal = CartUtil.getSubtotal();
    this.grandTotal = CartUtil.getGrandTotal();
    this.clearPaymentMethod();
  }

  clear() {
    CartUtil.clear();
    this.loadCart();
    this.cartItems = CartUtil.getItems();
    this.subtotal = CartUtil.getSubtotal();
    this.grandTotal = CartUtil.getGrandTotal();
    this.clearPaymentMethod();
    this.toastr.success('Caixa limpo com sucesso');

  }

  getPaymentMethods(): string[] {
    return ['Crédito', 'Débito', 'Dinheiro', 'Pix', 'Outros'];
  }


  loadPercentages() {
    const credit = localStorage.getItem('creditPercentage');
    const debit = localStorage.getItem('debitPercentage');

    if (credit) {
      this.creditPercentage = parseFloat(credit);
    }
    if (debit) {
      this.debitPercentage = parseFloat(debit);
    }
  }


  submitOrder() {
    if (this.paymentMethods.length === 0 || this.paymentMethods.some(p => !p.method || !p.amount)) {
      this.toastr.error('Preencha corretamente os métodos e valores de pagamento', 'Erro');
      return;
    }

    // if (!this.customerName || this.customerName.trim() === '') {
    //   this.toastr.error('Nome do cliente não pode estar vazio', 'Erro');
    //   return;
    // }

    // Salvar o nome do cliente no carrinho
    CartUtil.addCustomerName(this.customerName);

    this.loadPercentages();

    let totalWithFee = this.grandTotal;

    if (this.selectedPayment === 'Débito') {
      totalWithFee -= this.grandTotal * (this.debitPercentage / 100);
    } else if (this.selectedPayment === 'Crédito') {
      totalWithFee -= this.grandTotal * (this.creditPercentage / 100);
    }

    const order = {
      client: this.customerName,
      sale: {
        items: this.cartItems.map(item => ({
          quantity: item.quantity,
          price: item.price,
          purchasePrice: item.purchasePrice,
          discount: item.discount,
          title: item.title,
          product: item._id
        })),
        discount: this.generalDiscount,
        total: this.grandTotal,
        payments: this.paymentMethods // Novo formato para envio dos pagamentos
      }
    };

    this.busy = true;
    this.service.createOrder(order).subscribe({
      next: (data: any) => {
        this.busy = false;
        this.toastr.success(data.message);
        CartUtil.clear();  // Limpa o carrinho após a conclusão da compra
        this.loadCart();
      },
      error: (err: any) => {
        this.busy = false;
        if (err.error && err.error.message) {
            // Exibe a mensagem de erro recebida do backend
            this.toastr.error(err.error.message, 'Erro');
        } else {
            // Se o erro não tem mensagem, exibe uma mensagem genérica
            this.toastr.error('Falha ao processar a requisição', 'Erro');
        }
        console.log('Erro detalhado:', err);
    }
    });

    this.clearPaymentMethod();
    this.loadCart();
    this.clearTroco();
    this.clearSearch();
    this.clearCustomerName();
  }

// cria orçamentos
filterCustomer(event: any) {
  const query = event.query.toLowerCase();
  this.filteredCustomers = this.customerNames.filter(customer => customer.toLowerCase().includes(query));
}

loadCustomerNames() {
  this.service.getBudget().subscribe({
    next: (data: Budget[]) => {
      this.customerNames = data.map(budget => budget.client);
    },
    error: (err: any) => {
      console.log(err);
      this.toastr.error(err.message);
    }
  });
}


createBudget() {
  if (this.cartItems.length === 0) {
    this.toastr.error('O carrinho está vazio', 'Erro');
    return;
  }

  if (!this.customerName || this.customerName.trim() === '') {
    this.toastr.error('Nome do cliente não pode estar vazio', 'Erro');
    return;
  }

  const budget = {
    client: this.customerName,
    budget: {
      items: this.cartItems.map(item => {
        return {
          quantity: item.quantity,
          price: item.price,
          purchasePrice: item.purchasePrice,
          title: item.title,
          product: item._id
        };
      }),
      total: this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
    }
  };

  this.busy = true;
  this.service.createBudget(budget).subscribe({
    next: (data: any) => {
      this.busy = false;
      this.toastr.success(data.message);
      CartUtil.clear();
      this.loadCart();
      this.customerName = ''; // Limpar o campo de nome do cliente aqui
    },
    error: (err: any) => {
      console.log(err);
      this.busy = false;
      this.toastr.error(err.message);
    }
  });
}


clearCustomerName() {
this.customerName = '';
}

  clearPaymentMethod(): void {
    this.selectedPayment = undefined;
  }

  resetForm() {
    this.form.reset();
  }

  search(): void {
    if (this.searchQuery.trim() === '') {
      this.product = [];
      this.clearSearch();
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

  clearSearch(): void {
    this.searchQuery = '';
    this.product = [];
    this.busy = false; // Se aplicável, defina busy como falso
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Backspace' && this.searchQuery.trim() === '') {
      this.clearSearch();
    } else {
      this.search();
    }
  }


  // onFormPaymentSelected(formPayment: string): void {
  //   this.selectedPayment = formPayment;
  //   CartUtil.addPaymentForm(formPayment);
  // }

  onFormPaymentSelected(paymentMethod: string) {
    if (paymentMethod === 'Outros') {
      this.paymentMethods = [{ method: '', amount: 0 }, { method: '', amount: 0 }];
    } else {
      this.paymentMethods = [{ method: paymentMethod, amount: this.grandTotal }];
    }
  }

  calcTroco() {
    if (this.total > 0) {
      const troco = this.total - this.grandTotal;
      this.totalTroco = troco;
      return troco;
    } else {
      this.totalTroco = 0;
      return 0;
    }
  }

  clearTroco() {
    this.total = 0;
    this.calcTroco();
  }


  logo = 'assets/image/logo2.png'; // Adicione aqui a string base64 da sua imagem
  nome = 'Manancial papelaria e utilidades - xerox e impressoões';
  endereco = 'Quadra 10, lote 36, loja 01 Jardim Guaíra I -  Águas Lindas de Goiás';
  telefone = '(61) 99581-0812';
  cnpj = '52.068.148/0001-61';

  generatePDF(logo: string, nome: string, endereco: string, telefone: string, cnpj: any): void {
    const doc = new jsPDF();

    const logoWidth = 100; // largura da logo
const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2; // posição X centralizada
doc.addImage(logo, 'JPEG', logoX, 5, logoWidth, 30);

// Informações de endereço, telefone e CNPJ com ícones centralizados
doc.setFontSize(12);
doc.setFont('helvetica', 'normal');

// Texto de Endereço
const enderecoText = `Endereço: ${endereco}`;
const enderecoWidth = doc.getTextWidth(enderecoText);
const enderecoX = (doc.internal.pageSize.getWidth() - enderecoWidth) / 2;
doc.text(enderecoText, enderecoX, 45);

// Texto de Telefone
const telefoneText = `Telefone: ${telefone}`;
const telefoneWidth = doc.getTextWidth(telefoneText);
const telefoneX = (doc.internal.pageSize.getWidth() - telefoneWidth) / 2;
doc.text(telefoneText, telefoneX, 50);
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
    this.cartItems.forEach(item => {
        totalValue += item.price * item.quantity;
    });

    // Adiciona os itens do carrinho à tabela de dados e calcula o valor total
    const tableData = this.cartItems.map(item => [
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
    //doc.text(`Valor Total do Caixa: R$ ${totalValue.toFixed(2)}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    // Salva o PDF
    doc.save('caixa.pdf');
}

}
