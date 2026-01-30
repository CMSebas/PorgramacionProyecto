import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccesosPage } from './accesos.page';

const routes: Routes = [
  {
    path: '',
    component: AccesosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccesosPageRoutingModule {}
