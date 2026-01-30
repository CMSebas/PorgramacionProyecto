import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccesosPageRoutingModule } from './accesos-routing.module';

import { AccesosPage } from './accesos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccesosPageRoutingModule
  ],
  declarations: [AccesosPage]
})
export class AccesosPageModule {}
