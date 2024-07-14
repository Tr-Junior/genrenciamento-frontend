import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './pages/account/login-page/login-page.component';
import { FramePageComponent } from './pages/master/frame-page';
import { ProductsPageComponent } from './pages/store/products-page/products-page.component';
import { NewUserPageComponent } from './pages/account/new-user-page/new-user-page.component';
import { SalePageComponent } from './pages/store/sale-page/sale-page.component';
import { SalesPageComponent } from './pages/features/sales-page/sales-page.component';
import { EntranceAndExitComponent } from './pages/features/entrance-and-exit/entrance-and-exit.component';
import { InvoicingPageComponent } from './pages/features/invoicing-page/invoicing-page.component';
import { ExitsPageComponent } from './pages/features/exits-page/exits-page.component';
import { DetailsPageComponent } from './pages/features/details-page/details-page.component';
import { ProducRegistrationPageComponent } from './pages/store/produc-registration-page/produc-registration-page.component';
import { AuthService } from './services/auth.service';
import { PasswordChangePageComponent } from './pages/account/password-change-page/password-change-page.component';
import { BudgetPageComponent } from './pages/store/budget-page/budget-page.component';
import { LoginModalComponent } from './pages/account/login-sales/login-sales.component';
import { LoginRedirectGuard } from './services/loginRedirectGuard.service';
import { ProductsBuyComponent } from './pages/features/products-buy/products-buy.component';

const routes: Routes = [
  // { path: 'teste', component: ProducRegistrationPageComponent },

  { path: '', component: LoginPageComponent },
  {
    path: 'store',
    component: FramePageComponent,
    children: [
      { path: '', component: ProductsPageComponent, canActivate: [AuthService] },
    ]
  },
  {
    path: 'sale',
    component: FramePageComponent,
    children: [
      { path: '', component: SalePageComponent, canActivate: [AuthService] },
      { path: 'budget', component: BudgetPageComponent, canActivate: [AuthService] },
    ]
  },
  {
    path: 'login',
  component: FramePageComponent,
  children:
   [
    { path: 'login-sales', component: LoginModalComponent },
    { path: 'login-entrance-exits', component: LoginModalComponent },
  ]
  },
  {
    path: 'features',
    component: FramePageComponent,
    children: [
      { path: 'entranceAndExit', component: EntranceAndExitComponent, canActivate: [LoginRedirectGuard, AuthService] },
      { path: 'invoicing', component: InvoicingPageComponent, canActivate: [AuthService] },
      { path: 'exits', component: ExitsPageComponent, canActivate: [AuthService] },
      { path: 'details', component: DetailsPageComponent, canActivate: [AuthService] }
    ]
  },
  {
    path: 'ProductsToBuy',
    component: FramePageComponent,
    children: [
      { path: '', component: ProductsBuyComponent, canActivate: [AuthService] },
    ]
  },
  {
    path: 'sales',
    component: FramePageComponent,
    children: [
      { path: '', component: SalesPageComponent, canActivate: [LoginRedirectGuard, AuthService] },
    ]
  },
  {
    path: 'account',
    component: FramePageComponent,
    children: [
      { path: 'new-user', component: NewUserPageComponent, canActivate: [AuthService] },
      { path: 'passwordChange', component: PasswordChangePageComponent, canActivate: [AuthService] },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
