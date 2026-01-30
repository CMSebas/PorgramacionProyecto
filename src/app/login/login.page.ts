import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { get, ref, child, set } from 'firebase/database';
import { db } from '../firebase';
import { getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

type Usuario = { credencial?: string; nombre?: string; password?: string };

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  credencial = '';
  nombre = '';
  password = '';
  mensaje = '';

  constructor(private nav: NavController) {}

  // 🔥 SE EJECUTA CADA VEZ QUE SE ENTRA AL LOGIN
  async ionViewWillEnter() {
    try {
      const snap = await get(child(ref(db), 'Usuarios'));
      const data = snap.val();

      // 👉 SI NO HAY USUARIOS
      if (!data || Object.keys(data).length === 0) {

  const database = getDatabase(getApp());
  const counterRef = ref(database, 'meta/usuarios_counter');

  // ✅ RESETEA SIEMPRE a 0 cuando no hay usuarios
  await set(counterRef, 0);

  this.nav.navigateRoot('/registrar');
}
    } catch (e) {
      console.error('Error verificando usuarios:', e);
    }
  }

  async entrar() {
    this.mensaje = '';
    const cred = this.credencial.trim();
    const nom = this.nombre.trim().toLowerCase();
    const pass = this.password;

    if (!cred || !nom || !pass) {
      this.mensaje = 'Complete todos los campos';
      return;
    }

    try {
      const snap = await get(child(ref(db), 'Usuarios'));
      const data = (snap.val() ?? {}) as Record<string, Usuario>;

      let keyEncontrada: string | null = null;

      for (const [key, u] of Object.entries(data)) {
        if (
          (u?.credencial ?? '').trim() === cred &&
          (u?.nombre ?? '').trim().toLowerCase() === nom &&
          (u?.password ?? '') === pass
        ) {
          keyEncontrada = key;
          break;
        }
      }

      if (!keyEncontrada) {
        this.mensaje = 'Datos incorrectos';
        return;
      }

      localStorage.setItem('usuario_activo_key', keyEncontrada);
      this.nav.navigateRoot('/home');

    } catch (e: any) {
      console.error(e);
      this.mensaje = e?.message ?? 'Error conectando a la base de datos';
    }
  }

  registrarUsuario() {
    this.nav.navigateForward('/registrar');
  }
}
