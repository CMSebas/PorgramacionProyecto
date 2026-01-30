import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavController } from '@ionic/angular';
import { get, ref, child } from 'firebase/database';
import { db } from '../firebase';

import Chart from 'chart.js/auto';

type RegistroDia = { correcto?: number; incorrecto?: number };

type UsuarioDB = {
  nombre?: string;
  credencial?: string;
  registros?: Record<string, RegistroDia>;
};

type AnonimoDB = {
  registros?: Record<string, { incorrecto?: number }>;
};

type UsuarioView = {
  key: string;
  nombre: string;
  filas: { fecha: string; correcto: number; incorrecto: number }[];
  totalCorrecto: number;
  totalIncorrecto: number;
};

@Component({
  selector: 'app-accesos',
  templateUrl: './accesos.page.html',
  styleUrls: ['./accesos.page.scss'],
  standalone: false,
})
export class AccesosPage {
  desde = '';
  hasta = '';

  cargando = false;
  mensaje = '';
  usuarios: UsuarioView[] = [];

  // ===== MODAL =====
  modalGraficas = false;

  // ===== CANVAS =====
  @ViewChild('pieCanvas', { static: false }) pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas', { static: false }) barCanvas!: ElementRef<HTMLCanvasElement>;

  private pieChart?: Chart;
  private barChart?: Chart;

  constructor(private nav: NavController) {}

  volver() {
    this.nav.back();
  }

  private ymdToNumber(ymd: string): number {
    return parseInt(ymd.replace(/-/g, ''), 10);
  }

  private inRange(fecha: string, d?: string, h?: string): boolean {
    const f = this.ymdToNumber(fecha);
    const dn = d ? this.ymdToNumber(d) : null;
    const hn = h ? this.ymdToNumber(h) : null;

    if (dn !== null && f < dn) return false;
    if (hn !== null && f > hn) return false;
    return true;
  }

  async filtrar() {
  this.mensaje = '';
  this.cargando = true;
  this.usuarios = [];

  try {
    if (this.desde && this.hasta) {
      if (this.ymdToNumber(this.desde) > this.ymdToNumber(this.hasta)) {
        this.mensaje = 'La fecha "Desde" no puede ser mayor que "Hasta".';
        return;
      }
    }

    // ====== 1) USUARIOS ======
    const snapU = await get(child(ref(db), 'Usuarios'));
    const dataU = (snapU.val() ?? {}) as Record<string, UsuarioDB>;

    const out: UsuarioView[] = [];

    for (const [key, u] of Object.entries(dataU)) {
      const nombre = (u?.nombre ?? key).trim();
      const registros = u?.registros ?? {};

      const fechas = Object.keys(registros)
        .filter((f) => this.inRange(f, this.desde || undefined, this.hasta || undefined))
        .sort((a, b) => this.ymdToNumber(a) - this.ymdToNumber(b));

      const filas = fechas.map((f) => {
        const r = registros[f] ?? {};
        return {
          fecha: f,
          correcto: Number(r.correcto ?? 0),
          incorrecto: Number(r.incorrecto ?? 0),
        };
      });

      const totalCorrecto = filas.reduce((s, x) => s + x.correcto, 0);
      const totalIncorrecto = filas.reduce((s, x) => s + x.incorrecto, 0);

      if (filas.length > 0) out.push({ key, nombre, filas, totalCorrecto, totalIncorrecto });
    }

    // ====== 2) ANONIMOS ======
    const snapA = await get(child(ref(db), 'Anonimos'));
    const dataA = (snapA.val() ?? {}) as Record<string, AnonimoDB>;

    for (const [key, a] of Object.entries(dataA)) {
      // ignora el contador
      if (key === 'contador') continue;

      const registros = a?.registros ?? {};

      const fechas = Object.keys(registros)
        .filter((f) => this.inRange(f, this.desde || undefined, this.hasta || undefined))
        .sort((x, y) => this.ymdToNumber(x) - this.ymdToNumber(y));

      const filas = fechas.map((f) => {
        const r = registros[f] ?? {};
        return {
          fecha: f,
          correcto: 0,
          incorrecto: Number(r.incorrecto ?? 0),
        };
      });

      const totalCorrecto = 0;
      const totalIncorrecto = filas.reduce((s, x) => s + x.incorrecto, 0);

      if (filas.length > 0) {
        out.push({
          key,                 // anonimo1, anonimo2...
          nombre: key.replace('anonimo', 'Anónimo '),         // mostrar "anonimo1"
          filas,
          totalCorrecto,
          totalIncorrecto,
        });
      }
    }

    // Ordena por nombre (si quieres que anonimos queden al final me dices y lo ajusto)
    out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    this.usuarios = out;

    if (this.usuarios.length === 0) {
      this.mensaje = 'No hay registros en ese rango de fechas.';
    }
  } catch (e) {
    console.error(e);
    this.mensaje = 'Error conectando a la base de datos';
  } finally {
    this.cargando = false;
  }
}


  // ======= GRÁFICAS =======
  abrirGraficas() {
    if (!this.usuarios || this.usuarios.length === 0) {
      this.mensaje = 'No hay datos para graficar.';
      return;
    }
    this.modalGraficas = true;
  }

  cerrarGraficas() {
    this.modalGraficas = false;
    this.destruirCharts();
  }

  // Se ejecuta cuando el modal YA se mostró
  onModalDidPresent() {
    this.crearCharts();
  }

  private destruirCharts() {
    try {
      this.pieChart?.destroy();
      this.barChart?.destroy();
    } catch {}
    this.pieChart = undefined;
    this.barChart = undefined;
  }

  private crearCharts() {
    // por si se vuelve a abrir
    this.destruirCharts();

    const totalCorrectos = this.usuarios.reduce((s, u) => s + u.totalCorrecto, 0);
    const totalIncorrectos = this.usuarios.reduce((s, u) => s + u.totalIncorrecto, 0);

    const labels = this.usuarios.map((u) => u.nombre);
    const correctos = this.usuarios.map((u) => u.totalCorrecto);
    const incorrectos = this.usuarios.map((u) => u.totalIncorrecto);

    // PIE
    const pieCtx = this.pieCanvas?.nativeElement?.getContext('2d');
    if (pieCtx) {
      this.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: ['Correctos', 'Incorrectos'],
          datasets: [
            {
              data: [totalCorrectos, totalIncorrectos],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right' },
            title: { display: true, text: 'Total de Accesos' },
          },
        },
      });
    }

    // BARRAS
    const barCtx = this.barCanvas?.nativeElement?.getContext('2d');
    if (barCtx) {
      this.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Correctos', data: correctos },
            { label: 'Incorrectos', data: incorrectos },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Accesos por Usuario' },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }
  }
}
