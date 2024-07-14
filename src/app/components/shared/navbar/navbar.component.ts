import { Component, HostListener } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { Security } from 'src/app/utils/Security.util';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { LowStockNotificationService } from 'src/app/services/low-stok-notification.service';
import { Product } from 'src/app/models/product.model';
import { DataService } from 'src/app/services/data.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public user!: User;
  items: MenuItem[] = [];
  userItems: MenuItem[] = [];
  showMenu: boolean = false;
  public lowStockProducts: Product[] = [];
  public showLowStockList: boolean = false;
  public busy = false;
  product: Product[] = [];
  totalPurchaseValue: number = 0;

  constructor(
    private router: Router,
    private lowStockNotificationService: LowStockNotificationService,
    private service: DataService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.user = Security.getUser();
    this.items = [
      { label: 'Lista de Produtos', icon: 'pi pi-list', routerLink: '/store' },
      { label: 'Caixa', icon: 'pi pi-cart-plus', routerLink: '/sale' },
      { label: 'Orçamentos', icon: 'pi pi-file-export', routerLink: '/sale/budget' },
      { label: 'Vendas', icon: 'pi pi-shopping-cart', routerLink: '/sales' },
      { label: 'Faturamento', icon: 'pi pi-chart-line', routerLink: '/features/entranceAndExit' },
      { label: 'Pedidos', icon: 'pi pi-shopping-bag', routerLink: '/ProductsToBuy' }
    ];
    this.userItems = [
      { label: 'Cadastro de usuário', icon: 'pi pi-user-plus', routerLink: '/account/new-user' },
      { label: 'Alterar senha', icon: 'pi pi-key', routerLink: '/account/passwordChange' }
    ];
    this.lowStockNotificationService.lowStockProducts$.subscribe(products => {
      this.lowStockProducts = products;
    });
    this.listProd();
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  hideMenu() {
    if (window.innerWidth < 450) {
      this.showMenu = false;
    }
  }

  isScreenSizeAbove800x600(): boolean {
    return window.innerWidth > 800 && window.innerHeight > 600;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (!this.isScreenSizeAbove800x600()) {
      this.showMenu = false;
    }
  }

  logout() {
    Security.clear();
    this.router.navigate(['/']);
  }

  toggleLowStockList() {
    this.showLowStockList = !this.showLowStockList;
  }

  closeLowStockList() {
    this.showLowStockList = false;
  }

  listProd() {
    this.service.getProduct().subscribe(
      (data: any) => {
        this.busy = false;
        this.product = data;
        this.totalPurchaseValue = this.calculateTotalPurchaseValue(this.product);
        this.checkLowStock();
      }
    );
  }

  calculateTotalPurchaseValue(products: Product[]): number {
    let totalValue = 0;
    for (const product of products) {
      totalValue += product.purchasePrice * product.quantity;
    }
    return totalValue;
  }

  checkLowStock() {
    const lowStockProducts = this.product.filter(product =>
      product.quantity <= product.min_quantity && product.min_quantity > 0
    );
    this.lowStockNotificationService.setLowStockProducts(lowStockProducts);
  }
}
