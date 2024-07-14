import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { Entrances } from 'src/app/models/entrances.model';
import { Exits } from 'src/app/models/exits.model';
import { Product } from 'src/app/models/product.model';
import { DataService } from 'src/app/services/data.service';
import { Security } from 'src/app/utils/Security.util';
@Component({
  selector: 'app-invoicing-page',
  templateUrl: './invoicing-page.component.html',
  styleUrls: ['./invoicing-page.component.css']
})
export class InvoicingPageComponent {
  public busy = false;
  public pt: any;
  public entrances: Entrances[] = [];
  public entrancesId: any;
  public name: any;
  public startDate: any;
  public endDate: any;
  public ptBR: any;
  public rangeDates?: Date[];

  constructor(
    private service: DataService,
    private messageService: MessageService,
    private primengConfig: PrimeNGConfig,
    private toastr: ToastrService
  ) {
    this.ptBR = {
      firstDayOfWeek: 0,
      dayNames: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
      dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      dayNamesMin: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"],
      monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
      monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      today: 'Hoje',
      clear: 'Limpar'
    };
  }

  ngOnInit() {
    Security.clearPass();
    this.listEntrances();
  };


  searchDate() {
    if (this.rangeDates && this.rangeDates.length > 0) {
      const startDate = this.rangeDates[0];
      const endDate = this.rangeDates.length > 1 ? this.rangeDates[1] : startDate;
      this.getEntrancesByDateRange(startDate, endDate);
    } else {
      this.listEntrances();
    }
  }

  getEntrancesByDateRange(startDate: Date, endDate: Date) {
    this.busy = true;
    this.service.getEntrances().subscribe(
      (data: any) => {
        const selectedDate = new Date(startDate);
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1); // Adiciona um dia ao endDate

        this.entrances = data.filter((entrances: Entrances) => {
          const entrancesDate = new Date(entrances.createDate);
          return entrancesDate >= selectedDate && entrancesDate < nextDay;
        });
        this.busy = false;
      },
      (err: any) => {
        console.log(err);
        this.busy = false;
      }
    );
  }

  listEntrances() {
    this.busy = true;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    this.service.getEntrances().subscribe((data: any) => {
      this.entrances = data.filter((entrance: Entrances) => {
        const entranceDate = new Date(entrance.createDate);
        return entranceDate.getMonth() === currentMonth && entranceDate.getFullYear() === currentYear;
      });
      this.busy = false;
    });
  }


  getEntrancesById(id: any) {
    this
      .service
      .getEntrancesById(id)
      .subscribe(
        (data: any) => {
          this.busy = false;
          this.entrancesId = data._id
          console.log(data._id);
        }
      );

  }


  delete(id: any, code: any) {
    this
      .service
      .delEntrances(id)
      .subscribe(
        (data: any) => {
          this.busy = false;
          this.toastr.success(data.message, 'Entrada deletada');

          console.log(data);
        },
        (err: any) => {
          this.toastr.error(err.message, 'Erro ao deletar Saída');
          this.busy = false;
          console.log(err);
        }

      );
    this
      .service
      .delOrderByCode(code)
      .subscribe((data: any) => {
        this.busy = false;
        this.toastr.success('Venda deletada');
        this.listEntrances();
        console.log(data);
      })
    this.listEntrances();
  }

  search() {
    if (this.name == "") {
      this.ngOnInit();
    } else {
      this.entrances = this.entrances.filter(res => {
        return res.typeOrder.toLocaleLowerCase().match(this.name.toLocaleLowerCase());
      })
    }
  }

  clearSearch() {
    this.rangeDates = [];
    this.listEntrances();
  }




}
