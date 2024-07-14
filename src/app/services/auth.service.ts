import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { Security } from "../utils/Security.util";
import { ToastrService } from "ngx-toastr";

@Injectable()
export class AuthService implements CanActivate {

  constructor(
    private router: Router,
    private toastr: ToastrService,
  ) {
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = Security.getToken();
    if (!token || Security.isTokenExpired()) {
      this.router.navigate(['/']);
      return false;
    }

    if (state.url.startsWith('/features') || state.url.startsWith('/account/new-user')) {
      if (!Security.hasRole('admin')) {
        this.router.navigate(['/']);
        this.toastr.error('Página restrita, somente para administradores');
        return false;
      }

    }

    return true;
  }

}
