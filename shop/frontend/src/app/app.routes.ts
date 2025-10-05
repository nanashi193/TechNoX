import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import {ForgotPasswordComponent} from "./components/forgot-password/forgot-password.component";
import {ProductPageComponent} from "./components/product/product-page.component";

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },  // vào intro trước

    { path: 'home',  component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    {path: 'forgot-password', component: ForgotPasswordComponent},
    {path: 'products', component: ProductPageComponent},

    { path: '**', redirectTo: 'home' },

];
