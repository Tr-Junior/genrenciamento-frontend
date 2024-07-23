import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComunicacaoService {
  private produtoSalvoSource = new Subject<void>();
  produtoSalvo$ = this.produtoSalvoSource.asObservable();

  notificarProdutoSalvo() {
    this.produtoSalvoSource.next();
  }
}
