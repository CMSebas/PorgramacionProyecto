import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesosPage } from './accesos.page';

describe('AccesosPage', () => {
  let component: AccesosPage;
  let fixture: ComponentFixture<AccesosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccesosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
