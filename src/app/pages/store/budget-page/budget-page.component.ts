import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DataService } from 'src/app/services/data.service';
import { CartUtil } from 'src/app/utils/cart-util';
import { Security } from 'src/app/utils/Security.util';
import { Budget } from 'src/app/models/budget-model';
import { CartItem } from 'src/app/models/cart-item.model';

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
          discount: 0,
        };

        // Adiciona o item ao carrinho no localStorage
        CartUtil.add(cartItem._id, cartItem.title, cartItem.quantity, cartItem.price, cartItem.discount);
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

}
