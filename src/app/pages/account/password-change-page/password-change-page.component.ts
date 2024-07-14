import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DataService } from 'src/app/services/data.service';
import { Security } from 'src/app/utils/Security.util';

@Component({
  selector: 'app-password-change-page',
  templateUrl: './password-change-page.component.html',
  styleUrls: ['./password-change-page.component.css']
})
export class PasswordChangePageComponent implements OnInit {
  public form: FormGroup;
  public user: any;
  public busy = false;

  public roles: any[] = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Usuário', value: 'user' }
  ];

  constructor(
    private service: DataService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      id: [{ value: '', disabled: true }],
      name: [{ value: '', disabled: true }],
      password: ['', Validators.required],
      pass: ['', Validators.required],
      confirmarSenha: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.user = Security.getUser();
    if (this.user) {
      this.getUserById(this.user._id);
    }
  }

  getUserById(id: string) {
    this.busy = true;
    this.service.getUserById(id).subscribe(
      (data: any) => {
        this.busy = false;
        this.form.controls['id'].setValue(data._id);
        this.form.controls['name'].setValue(data.name);

      },
      (err: any) => {
        console.log(err);
        this.busy = false;
      }
    );
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
    const formData = {
      id: this.user._id,
      password: this.form.value.password,
      pass: this.form.value.pass
    };
    this.service.updatePassword(formData).subscribe(
      (data: any) => {
        this.busy = false;
        this.toastr.success(data.message, 'Atualizado!');
        this.resetForm();
      },
      (err: any) => {
        console.log(err);
        this.busy = false;
      }
    );
  }

  resetForm() {
    this.form.reset();
  }
}
