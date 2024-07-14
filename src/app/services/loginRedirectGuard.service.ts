import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Security } from '../utils/Security.util';

@Injectable({
  providedIn: 'root'
})
export class LoginRedirectGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = Security.getPass();
    if (!user) {
      // Armazenar a rota de destino no sessionStorage
      sessionStorage.setItem('redirectRoute', state.url);

      // Verificar qual a rota de destino
      const destinationRoute = state.url.split('/')[1];
      if (destinationRoute === 'sales') {
        this.router.navigate(['/login/login-sales']);
      } else if (destinationRoute === 'features' && state.url.includes('entranceAndExit')) {
        this.router.navigate(['/login/login-entrance-exits']); // Corrigir erro de digitação aqui
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
    return true;
  }
}
