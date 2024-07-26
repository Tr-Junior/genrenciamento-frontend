import { User } from "../models/user.model";
import jwtDecode from 'jwt-decode';

export class Security {
  public static set(user: User, token: string) {
    const data = JSON.stringify(user);
    sessionStorage.setItem('wrconexao', this.b64EncodeUnicode(data));
    sessionStorage.setItem('wrconexaotoken', token);
  }

  public static setUser(user: User) {
    const data = JSON.stringify(user);
    sessionStorage.setItem('wrconexao', this.b64EncodeUnicode(data));
  }

  public static setPass(pass: User) {
    const data = JSON.stringify(pass);
    sessionStorage.setItem('user', this.b64EncodeUnicode(data));
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
    sessionStorage.setItem('wrconexaotoken', token);
  }

  public static getUser(): User {
    const data = sessionStorage.getItem('wrconexao');
    if (data) {
      return JSON.parse(this.b64DecodeUnicode(data));
    } else {
      return null as any;
    }
  }

  public static getToken(): string {
    const data = sessionStorage.getItem('wrconexaotoken');
    if (data) {
      return data;
    } else {
      return null as any;
    }
  }

  public static hasToken(): boolean {
    return !!this.getToken();
  }

  public static clear() {
    sessionStorage.removeItem('wrconexao');
    sessionStorage.removeItem('wrconexaotoken');
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
