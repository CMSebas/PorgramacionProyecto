import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { getApp } from 'firebase/app';
import { getDatabase, ref, get, set, runTransaction } from 'firebase/database';

@Component({
  selector: 'app-registrar',
  templateUrl: './registrar.page.html',
  styleUrls: ['./registrar.page.scss'],
  standalone: false,
})
export class RegistrarPage {
  credencial = '';
  nombre = '';
  password = '';

  constructor(private nav: NavController) {}

  volver() {
    this.nav.back();
  }

  // ✅ toma SOLO claves tipo u1,u2,u3... (ignora -Ok..., u1769..., etc.)
  private getMaxUNumber(usuariosObj: any): number {
    if (!usuariosObj) return 0;

    let max = 0;

    for (const key of Object.keys(usuariosObj)) {
      // Solo acepta u + números puros (u1, u2, u3...)
      const m = /^u(\d+)$/.exec(key);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return max;
  }

  async registrar() {
    
    if (!this.credencial || !this.nombre || !this.password) {
      alert('Complete todos los campos');
      return;
    }
const pass = this.password.trim();
const regex = /^[ABCD0-9]+$/;

if (!regex.test(pass)) {
  alert('La contraseña solo puede contener letras A, B, C o D en MAYÚSCULAS y números');
  return;
}
    try {
      
      const db = getDatabase(getApp());

      const usuariosRef = ref(db, 'Usuarios');
      const counterRef = ref(db, 'meta/usuarios_counter');

      // 1) Lee usuarios actuales para saber el mayor uN (u1,u2,...)
      const snapUsuarios = await get(usuariosRef);
      const usuariosObj = snapUsuarios.exists() ? snapUsuarios.val() : null;
      const maxU = this.getMaxUNumber(usuariosObj); // ej: si hay u1,u2 => 2

      // 2) Asegura que el contador no sea menor que maxU
      //    Si no existe, lo inicializa en maxU
      await runTransaction(counterRef, (current) => {
        const cur = typeof current === 'number' ? current : 0;
        return cur < maxU ? maxU : cur;
      });

      // 3) Ahora sí incrementa para obtener el siguiente (u3,u4,...)
      const tx = await runTransaction(counterRef, (current) => {
        const cur = typeof current === 'number' ? current : maxU;
        return cur + 1;
      });

      const next = tx.snapshot.val() as number; // 3,4,5...
      const nuevaKey = `u${next}`;

      // 4) Guarda el usuario sin tocar u1/u2
      await set(ref(db, `Usuarios/${nuevaKey}`), {
        credencial: this.credencial.trim(),
        nombre: this.nombre.trim(),
        password: this.password,
      });

      alert(`Usuario registrado como ${nuevaKey}`);
      this.nav.navigateBack('/login');

    } catch (err) {
      console.error(err);
      alert('Error al registrar usuario');
    }
  }
}
