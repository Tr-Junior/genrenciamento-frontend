
import { User } from "../models/user.model";
import jwtDecode from 'jwt-decode';

export class Security {
  public static set(user: User, token: string) {
    const data = JSON.stringify(user);
    localStorage.setItem('wrconexao', this.b64EncodeUnicode(data));
    localStorage.setItem('wrconexaotoken', token);
  }

  public static isTokenExpired(): boolean {
    const token = this.getToken();
    if (token) {
      const decodedToken: any = jwtDecode(token); // Decodifica o token JWT para obter os dados
      const expirationDate = new Date(decodedToken.exp * 1000); // Atribui a data de expiração do token em segundos
      const now = new Date();
      return now > expirationDate;
    }
    return true; // Se o token não estiver disponível, assume-se que o token tenha expirado
  }



  public static setUser(user: User) {
    const data = JSON.stringify(user);
    localStorage.setItem('wrconexao', this.b64EncodeUnicode(data));
  }

  public static setPass(pass: User) {
    const data = JSON.stringify(pass);
    sessionStorage.setItem('user',this.b64EncodeUnicode(data));
  }

  public static getPass(): User {
    const data = sessionStorage.getItem('user');
    if (data) {
      return JSON.parse(this.b64DecodeUnicode(data));
    } else {
      return null as any;
    }
  }


  public static setToken(token: string) {
    localStorage.setItem('wrconexaotoken', token);
  }

  public static getUser(): User {
    const data = localStorage.getItem('wrconexao');
    if (data) {
      return JSON.parse(this.b64DecodeUnicode(data));
    } else {
      return null as any;
    }
  }

  public static getToken(): string {
    const data = localStorage.getItem('wrconexaotoken');
    if (data) {
      return data;
    } else {
      return null as any;
    }
  }

  public static hasToken(): boolean {
    if (this.getToken())
      return true;
    else
      return false;
  }

  public static clear() {
    localStorage.removeItem('wrconexao');
    localStorage.removeItem('wrconexaotoken');
  }

  public static clearPass() {
    sessionStorage.removeItem('user');
  }

  public static hasRole(role: string): boolean {
    const user = this.getUser();
    return user && user.roles.includes(role);
  }

  private static b64EncodeUnicode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(Number('0x' + p1))));
  }

  private static b64DecodeUnicode(str: string): string {
    return decodeURIComponent(Array.prototype.map.call(window.atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  }
}
