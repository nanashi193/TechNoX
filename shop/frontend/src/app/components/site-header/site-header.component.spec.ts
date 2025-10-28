import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:shop/frontend/src/app/components/site-header/site-header.component.spec.ts
import { SiteHeaderComponent } from './site-header.component';

describe('SiteHeaderComponent', () => {
  let component: SiteHeaderComponent;
  let fixture: ComponentFixture<SiteHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteHeaderComponent);
========
import { LoginComponent } from './login';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
>>>>>>>> 689b702c74dd9ee77d95e07c6a03e15419c552f1:shop/frontend/src/app/features/auth/login.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
