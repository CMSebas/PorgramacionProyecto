import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { getApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

type Usuario = { credencial?: string; nombre?: string; password?: string };

@Component({
  selector: 'app-modificar',
  templateUrl: './modificar.page.html',
  styleUrls: ['./modificar.page.scss'],
  standalone: false,
})
export class ModificarPage {
  credencial = '';
  pass1 = '';
  pass2 = '';
  mensaje = '';

  // ✅ NUEVO: nombre mostrado debajo de credencial
  nombreEncontrado = '';

  // guardamos la key real (u1/u2/u3)
  private userKey: string | null = null;

  constructor(private nav: NavController) {}

  volver() {
    this.nav.back();
  }

  async buscar() {
    this.mensaje = '';
    this.userKey = null;
    this.nombreEncontrado = '';

    const cred = this.credencial.trim();
    if (!cred) {
      this.mensaje = 'Ingrese la credencial';
      return;
    }

    try {
      const db = getDatabase(getApp());
      const snap = await get(ref(db, 'Usuarios'));
      const data = (snap.val() ?? {}) as Record<string, Usuario>;

      for (const [key, u] of Object.entries(data)) {
        if ((u?.credencial ?? '').toString().trim() === cred) {
          this.userKey = key;

          // ✅ aquí llenamos el nombre
          this.nombreEncontrado = (u?.nombre ?? '').toString().trim();

          this.mensaje = `Usuario encontrado: ${this.nombreEncontrado}`;
          return;
        }
      }

      this.mensaje = 'No existe un usuario con esa credencial';
    } catch (e: any) {
      console.error(e);
      this.mensaje = e?.message ?? 'Error conectando a la base de datos';
    }
  }

  async guardarCambios() {
    this.mensaje = '';

    if (!this.userKey) {
      this.mensaje = 'Primero busque el usuario';
      return;
    }
    if (!this.pass1 || !this.pass2) {
      this.mensaje = 'Complete las contraseñas';
      return;
    }
    if (this.pass1 !== this.pass2) {
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }

    try {
      const db = getDatabase(getApp());
      await update(ref(db, `Usuarios/${this.userKey}`), {
        password: this.pass1,
      });

      this.nav.navigateRoot('/home');
    } catch (e: any) {
      console.error(e);
      this.mensaje = e?.message ?? 'Error guardando cambios';
    }
  }
}
