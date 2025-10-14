import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import {ForgotPasswordComponent} from "./components/forgot-password/forgot-password.component";
import {ProductPageComponent} from "./components/product/product-page.component";
import {ownerGuard} from "./guards/owner.guard";

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },  // vào intro trước

    { path: 'home',  component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    {
        path: 'verify-email',
        loadComponent: () => import('./components/verify-email/verify-email.component')
            .then(m => m.VerifyEmailComponent)
    },
    {
        path: 'verify-email/pending',
        loadComponent: () => import('./components/verify-pending/verify-pending.component')
            .then(m => m.VerifyPendingComponent)
    },
    {path: 'forgot-password', component: ForgotPasswordComponent},
    {path: 'products', component: ProductPageComponent},
    {
        path: 'product/:id',
        loadComponent: () =>
            import('./components/detail-product/detail-product.component').then(m => m.DetailProductComponent),
    },
    {path: 'legal',
        loadComponent: () => import('./components/legal/legal-layout/legal-layout.component')
            .then(m => m.LegalLayoutComponent),
        children: [
            { path: 'about',
                loadComponent: () => import('./components/legal/about/about.component').then(m => m.AboutComponent),
                title: 'Giới thiệu | TechNoX' },
            { path: 'privacy-policy',
                loadComponent: () => import('./components/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
                title: 'Chính sách bảo mật | TechNoX' },
            { path: 'terms',
                loadComponent: () => import('./components/legal/terms/terms.component').then(m => m.TermsComponent),
                title: 'Điều khoản sử dụng | TechNoX' },
            { path: 'warranty',
                loadComponent: () => import('./components/legal/warranty/warranty.component').then(m => m.WarrantyComponent),
                title: 'Chính sách bảo hành | TechNoX' },
            { path: 'returns',
                loadComponent: () => import('./components/legal/returns/returns.component').then(m => m.ReturnsComponent),
                title: 'Hủy giao dịch, đổi trả | TechNoX' },
            { path: '', redirectTo: 'about', pathMatch: 'full' }
        ]},
    {
        path: 'owner',
        // canActivate: [ownerGuard], TODO co token ADMIN thi bat
        loadComponent: () => import('./components/owner/layout/owner-layout.component').then(m => m.OwnerLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./components/owner/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            // các mục còn lại sẽ làm sau
            // { path: 'products', loadComponent: () => import('../admin/products/products-list.component').then(m => m.ProductsList) },
            // { path: 'orders', loadComponent: () => import('../admin/orders/orders-list.component').then(m => m.OrdersList) },
            // { path: 'users', loadComponent: () => import('../admin/users/users-list.component').then(m => m.UsersList) },
        ]
    },
    { path: '**', redirectTo: 'home' },

];
