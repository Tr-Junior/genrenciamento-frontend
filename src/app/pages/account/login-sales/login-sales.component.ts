import { Component, ElementRef, ViewChild } from '@angular/core';
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

  @ViewChild('passwordInput') passwordInput!: ElementRef;

  ngAfterViewInit() {
    this.passwordInput.nativeElement.focus();
  }

  ngOnInit(): void {
    this.clear();
  }

  login() {

  }

  setPass(user: any) {
    Security.setPass(user);
  }

  clear() {
    Security.clearPass();
  }
}
