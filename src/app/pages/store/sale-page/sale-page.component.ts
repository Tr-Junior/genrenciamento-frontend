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
  public total = 0;
  public totalTroco = 0;
  public quotes: Cart[] = [];
  public customerName: string = '';  // Adicionado


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

  ngOnInit() {
    this.loadCart();
    this.listProdSilent();
    this.user = Security.getUser();
    this.calculateTotal(); // Carregar orçamentos salvos na inicialização
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
    CartUtil.add(item._id, item.title, item.quantity, item.price, item.discount);
    this.loadCart();
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
    CartUtil.updateItem(item._id, item.title, item.quantity, item.price, item.discount);

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
    this.toastr.success('Carrinho esvaziado com sucesso', 'Limpar Carrinho');

  }

  getPaymentMethods(): string[] {
    return ['Crédito', 'Débito', 'Dinheiro', 'Pix'];
  }

  submitOrder() {
    if (!this.selectedPayment) {
      this.toastr.error('Selecione a forma de pagamento', 'Erro');
      return;
    }
    // Cria um objeto contendo as informações do cliente e dos itens do carrinho
    const order = {
      customer: this.user.name,
      sale: {
        items: this.cartItems.map(item => {
          return {
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            title: item.title,
            product: item._id
          };
        }),
        formPayment: this.selectedPayment,
        discount: this.generalDiscount,
        total: this.grandTotal
      }
    };

    this.busy = true;
    this.service.createOrder(order).subscribe({
      next: (data: any) => {
        this.busy = false;
        this.toastr.success(data.message);
        CartUtil.clear(); // Limpa o carrinho após a conclusão da compra
        this.loadCart();
      },
      error: (err: any) => {
        console.log(err);
        this.busy = false;
        this.toastr.success(err.message);
      }
    });
    this.clearPaymentMethod();
    this.loadCart();
    this.clearTroco();
  }

// cria orçamentos
createBudget() {
  if (this.cartItems.length === 0) {
    this.toastr.error('O carrinho está vazio', 'Erro');
    return;
  }

  if (!this.customerName || this.customerName.trim() === '') {
    this.toastr.error('Nome do cliente não pode estar vazio', 'Erro');
    return;
  }

  // Cria um objeto contendo as informações do cliente e dos itens do carrinho
  const budget = {
    client: this.customerName,  // Usar customerName diretamente
    budget: {
      items: this.cartItems.map(item => {
        return {
          quantity: item.quantity,
          price: item.price,
          title: item.title,
          product: item._id
        };
      }),
      total: this.grandTotal
    }
  };

  this.busy = true;
  this.service.createBudget(budget).subscribe({
    next: (data: any) => {
      this.busy = false;
      this.toastr.success(data.message);
      CartUtil.clear(); // Limpa o carrinho após a conclusão da compra
      this.loadCart();
    },
    error: (err: any) => {
      console.log(err);
      this.busy = false;
      this.toastr.error(err.message);  // Corrigir para toastr.error
    }
  });
  this.clearPaymentMethod();
  this.loadCart();
  this.clearTroco();
  this.customerName = '';
}



  clearPaymentMethod(): void {
    this.selectedPayment = undefined;
  }

  resetForm() {
    this.form.reset();
  }

  search(): void {
    if (!this.searchQuery) {
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


  onFormPaymentSelected(formPayment: string): void {
    this.selectedPayment = formPayment;
    CartUtil.addPaymentForm(formPayment);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.search();
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


  logo = 'assets/image/logof2.png'; // Adicione aqui a string base64 da sua imagem
  nome = 'Conexão elétrica e hidráulica';
  endereco = 'Qd 33 Conj "B" N° 01-A setor 2  -  Águas Lindas de Goiás';
  telefone = '(61) 99571-0019';
  cnpj = '52.068.148/0001-61';

  generatePDF(logo: string, nome: string, endereco: string, telefone: string, cnpj: any): void {
    const doc = new jsPDF();

    // Adiciona a logo centralizada
    const logoWidth = 100; // largura da logo
    const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2; // posição X centralizada
    doc.addImage(logo, 'JPEG', logoX, 5, logoWidth, 30);

    // Informações de endereço, telefone e CNPJ com ícones centralizados
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const infoX = 45; // posição X das informações
    doc.text(`Endereço: ${endereco}`, infoX, 40);
    doc.text(`Telefone: ${telefone}`, infoX, 50);
    doc.text(`CNPJ: ${cnpj}`, infoX + 70, 50); // adiciona 70 para espaçamento entre telefone e CNPJ

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
