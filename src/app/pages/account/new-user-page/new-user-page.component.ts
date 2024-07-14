import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService, MessageService } from 'primeng/api';
import { User } from 'src/app/models/user.model';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-new-user-page',
  templateUrl: './new-user-page.component.html',
  styleUrls: ['./new-user-page.component.css']
})
export class NewUserPageComponent {
  public busy = false;
  public user: User[] = [];
  public form: FormGroup;
  public roles: any[] = [
    { label: 'Usuário', value: 'user' },
    { label: 'Administrador', value: 'admin' },

  ];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private data: DataService,
    private service: DataService,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.compose([
        Validators.required
      ])],
      password: ['', Validators.compose([
        Validators.required
      ])],
      confirmarSenha: ['', Validators.compose([
        Validators.required
      ])],
      pass: ['', Validators.compose([
        Validators.required
      ])],
      roles: ['', Validators.compose([
        Validators.required
      ])]
    }, { validators: this.passwordMatchValidator });

  }

  ngOnInit() {
  }

  resetForm() {
    this.form.reset();
  }

  refresh(): void {
    window.location.reload();
  }
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmarSenha = form.get('confirmarSenha')?.value;
    return password === confirmarSenha ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid) {
      this.toastr.error('Preencha corretamente todos os campos');
      return;
    }

    this.busy = true;

    const newName = this.form.value.name;

    // Verificar se o usuário com o mesmo nome já existe
    this.service.checkUsernameExists(newName).subscribe({
      next: (exists: boolean) => {
        if (exists) {
          this.toastr.error('Nome de usuário já existe');
          this.busy = false;
        } else {
          // Criar um novo usuário
          const newUser = new User(
            '', // O ID será gerado automaticamente pelo backend
            this.form.value.name,
            this.form.value.password,
            this.form.value.pass,
            this.form.value.roles
          );

          this.service.createUser(newUser).subscribe({
            next: (data: any) => {
              this.busy = false;
              this.toastr.success(data.message);
              this.resetForm();
            },
            error: (err: any) => {
              console.log(err);
              this.busy = false;
            }
          });
        }
      },
      error: (err: any) => {
        console.log(err);
        this.busy = false;
      }
    });
  }
}
