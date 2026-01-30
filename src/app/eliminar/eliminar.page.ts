import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { get, ref, child, remove } from 'firebase/database';
import { db } from '../firebase';

type Usuario = { credencial?: string; nombre?: string; password?: string };

@Component({
  selector: 'app-eliminar',
  templateUrl: './eliminar.page.html',
  styleUrls: ['./eliminar.page.scss'],
  standalone: false,
})
export class EliminarPage {
  credencial = '';
  mensaje = '';

  constructor(private nav: NavController) {}

  volver() {
    this.nav.back();
  }

  async eliminarUsuario() {
    this.mensaje = '';

    const cred = this.credencial.trim();
    if (!cred) {
      this.mensaje = 'Ingrese la credencial';
      return;
    }

    try {
      const snap = await get(child(ref(db), 'Usuarios'));
      const data = (snap.val() ?? {}) as Record<string, Usuario>;

      // Buscar por credencial
      let keyEncontrada: string | null = null;
      let nombreEncontrado: string | null = null;

      for (const [key, u] of Object.entries(data)) {
        if ((u?.credencial ?? '').trim() === cred) {
          keyEncontrada = key;
          nombreEncontrado = (u?.nombre ?? '').trim();
          break;
        }
      }

      if (!keyEncontrada) {
        this.mensaje = 'No existe ese usuario';
        return;
      }

      // Eliminar
      await remove(ref(db, `Usuarios/${keyEncontrada}`));

      // Si borró al usuario logueado, sacarlo al login
      const activo = localStorage.getItem('usuario_activo_key');
      if (activo && activo === keyEncontrada) {
        localStorage.removeItem('usuario_activo_key');
        this.mensaje = `Usuario ${nombreEncontrado || keyEncontrada} eliminado`;
        this.nav.navigateRoot('/login');
        return;
      }

      this.mensaje = `Usuario ${nombreEncontrado || keyEncontrada} eliminado`;
      this.credencial = '';
    } catch (e) {
      console.error(e);
      this.mensaje = 'Error conectando a la base de datos';
    }
  }
}
