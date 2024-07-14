import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Security } from '../../../utils/Security.util';

@Component({
  selector: 'app-login-sales',
  templateUrl: './login-sales.component.html',
  styleUrls: ['./login-sales.component.css']
})
export class LoginModalComponent {
  username: string = '';
  password: string = '';

  constructor(
    private toastr: ToastrService,
    private router: Router
  ) {}


  ngOnInit(): void {
    this.clear();
  }

  login() {
    const storedUser = Security.getUser();
    if (storedUser) {
      const tokenPassword = storedUser.pass;
      if (this.password === tokenPassword) {
        Security.setPass(storedUser);
        // Obter a rota de destino armazenada anteriormente
        const redirectRoute = sessionStorage.getItem('redirectRoute');
        if (redirectRoute) {
          this.router.navigate([redirectRoute]);
          sessionStorage.removeItem('redirectRoute');
        } else {
          this.router.navigate(['/']);
        }
      } else {
        this.toastr.error('Credenciais inválidas. Por favor, tente novamente.');
      }
    } else {
      this.toastr.error('Usuário não autenticado. Por favor, faça login.');
      this.router.navigate(['/login']);
    }
  }

  setPass(user: any) {
    Security.setPass(user);
  }

  clear() {
    Security.clearPass();
  }
}
