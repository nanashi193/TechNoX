import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ProductPageComponent } from './components/product/product-page.component';
import { CartComponent } from './components/cart/cart.component';
import { loginGuard } from './guards/login.guard';
import { ownerGuard } from './guards/owner.guard';

// Non-standalone (nếu component này không standalone)
import { PaymentDetailComponent } from './components/paymentDetail/payment-detail.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    // ===== Payment =====
    {
        path: 'payment',
        loadComponent: () =>
            import('./components/payment/payment-component').then(m => m.PaymentComponent),
        title: 'Thanh toán | TechNoX'
    },
    {
        path: 'payment/success',
        loadComponent: () =>
            import('./components/paymentDetail/paymentStatus/payment-success.component')
                .then(m => m.PaymentSuccessComponent)
    },
    {
        path: 'payment/cancel',
        loadComponent: () =>
            import('./components/paymentDetail/paymentStatus/payment-cancel.component')
                .then(m => m.PaymentCancelComponent)
    },
    { path: 'payment-detail', component: PaymentDetailComponent, data: { title: 'Chi tiết đơn hàng | TechNoX' } },
    { path: 'checkout', redirectTo: 'payment', pathMatch: 'full' },

    // ===== Public =====
    { path: 'home', component: HomeComponent },
    { path: 'login',  component: LoginComponent,  canActivate: [loginGuard], data: { hideChrome: true, title: 'Đăng nhập | TechNoX' } },
    { path: 'signup', component: SignupComponent, canActivate: [loginGuard], data: { hideChrome: true, title: 'Đăng ký | TechNoX' } },

    {
        path: 'verify-email',
        loadComponent: () => import('./components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
        data: { hideChrome: true, title: 'Xác minh email | TechNoX' }
    },
    {
        path: 'verify-email/pending',
        loadComponent: () => import('./components/verify-pending/verify-pending.component').then(m => m.VerifyPendingComponent),
        data: { hideChrome: true, title: 'Đang chờ xác minh | TechNoX' }
    },

    // ===== Products & users =====
    { path: 'products', component: ProductPageComponent },
    { path: 'cart', component: CartComponent },
    {
        path: 'product/:id',
        loadComponent: () => import('./components/detail-product/detail-product.component').then(m => m.DetailProductComponent),
    },
    { path: 'user/:id', loadComponent: () => import('./components/detail-user/detail.user').then(m => m.DetailUserComponent) },
    { path: 'profile',  loadComponent: () => import('./components/detail-user/detail.user').then(m => m.DetailUserComponent) },

    // ===== Legal =====
    {
        path: 'legal',
        loadComponent: () => import('./components/legal/legal-layout/legal-layout.component').then(m => m.LegalLayoutComponent),
        children: [
            { path: 'about',          loadComponent: () => import('./components/legal/about/about.component').then(m => m.AboutComponent),                         title: 'Giới thiệu | TechNoX' },
            { path: 'privacy-policy', loadComponent: () => import('./components/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent), title: 'Chính sách bảo mật | TechNoX' },
            { path: 'terms',          loadComponent: () => import('./components/legal/terms/terms.component').then(m => m.TermsComponent),                         title: 'Điều khoản sử dụng | TechNoX' },
            { path: 'warranty',       loadComponent: () => import('./components/legal/warranty/warranty.component').then(m => m.WarrantyComponent),                 title: 'Chính sách bảo hành | TechNoX' },
            { path: 'returns',        loadComponent: () => import('./components/legal/returns/returns.component').then(m => m.ReturnsComponent),                   title: 'Hủy giao dịch, đổi trả | TechNoX' },
            { path: '', redirectTo: 'about', pathMatch: 'full' }
        ]
    },

    // ===== Owner =====
    {
        path: 'owner',
        canActivate: [ownerGuard],
        loadComponent: () =>
            import('./components/owner/layout/owner-layout.component')
                .then(m => m.OwnerLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./components/owner/dashboard/dashboard.component')
                        .then(m => m.DashboardComponent),
                title: 'Tổng quan | Owner'
            },
            {
                path: 'products',
                loadComponent: () =>
                    import('./components/owner/products/products-list/products-list.component')
                        .then(m => m.ProductsListComponent),
                title: 'Quản lý sản phẩm | Owner'
            },
            {
                path: 'products/new',
                loadComponent: () =>
                    import('./components/owner/products/products-detail/products-detail.component')
                        .then(m => m.ProductsDetailComponent),
                title: 'Thêm sản phẩm | Owner'
            },
            {
                path: 'products/:id',
                loadComponent: () =>
                    import('./components/owner/products/products-detail/products-detail.component')
                        .then(m => m.ProductsDetailComponent),
                title: 'Sửa sản phẩm | Owner'
            },
            {
                path: 'users',
                loadComponent: () =>
                    import('./components/owner/users/users-list/users-list.component')
                        .then(m => m.UsersListComponent),
                title: 'Người dùng của TechNoX'
            },
            {
                path: 'users/:id',
                loadComponent: () =>
                    import('./components/owner/users/users-detail/users-detail.component')
                        .then(m => m.UserDetailComponent)
            }
        ]
    },

    { path: '**', redirectTo: 'home' }
];
