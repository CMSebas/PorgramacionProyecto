import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { NavController } from '@ionic/angular';

interface Usuario {
  nombre?: string;
  credencial?: string;
  password?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  nombre$!: Observable<string | null>;
  estadoPuerta$!: Observable<string | null>;

  constructor(
    private db: AngularFireDatabase,
    private nav: NavController
  ) {
    // 🔑 obtenemos la clave del usuario logueado
    const key = localStorage.getItem('usuario_activo_key');

    // seguridad básica: si no hay sesión, vuelve a login
    if (!key) {
      this.nav.navigateRoot('/login');
      return;
    }

    // 📡 leer nombre desde Firebase
    this.nombre$ = this.db
      .object<string>(`Usuarios/${key}/nombre`)
      .valueChanges();

      this.estadoPuerta$ = this.db
      .object<string>('Puerta/Estado')
      .valueChanges();
  }

  irARegistrar() {
    this.nav.navigateForward('/registrar');
  }
  irAModificar() {
    this.nav.navigateForward('/modificar');
  }

  irAEliminar() {
  this.nav.navigateForward('/eliminar');
}

irAAccesos() {
  this.nav.navigateForward('/accesos');
}

  // 🔌 Cerrar sesión
  logout() {
    localStorage.removeItem('usuario_activo_key');
    this.nav.navigateRoot('/login');
  }
}




















