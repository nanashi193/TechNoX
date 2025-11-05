import { Routes } from '@angular/router';
import { LoginComponent } from './components/Component-login/login/login.component';
import { SignupComponent } from './components/Component-login/signup/signup.component';
import { HomeComponent } from './components/Component-home/home/home.component';
import { ForgotPasswordComponent } from './components/Component-login/forgot-password/forgot-password.component';
import { ProductPageComponent } from './components/Component-product/product/product-page.component';
import { CartComponent } from './components/Component-cart/cart/cart.component';
import { loginGuard } from './guards/login.guard';
import { ownerGuard } from './guards/owner.guard'; // << bật lại guard Owner

// Payment detail (component thường)
import { PaymentDetailComponent } from './components/Component-payment/paymentInfor/payment-detail.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    // ===== Payment (lazy) =====
    {
        path: 'payment',
        loadComponent: () =>
            import('./components/Component-payment/payment/payment-component')
                .then(m => m.PaymentComponent),
        title: 'Thanh toán | TechNoX'
    },
    {
        path: 'payment/success',
        loadComponent: () =>
            import('./components/Component-payment/paymentStatus/payment-success.component')
                .then(m => m.PaymentSuccessComponent)
    },
    {
        path: 'payment/cancel',
        loadComponent: () =>
            import('./components/Component-payment/paymentStatus/payment-cancel.component')
                .then(m => m.PaymentCancelComponent)
    },
    { path: 'payment-detail', component: PaymentDetailComponent, data: { title: 'Chi tiết đơn hàng | TechNoX' } },
    { path: 'checkout', redirectTo: 'payment', pathMatch: 'full' },

    // ===== Public =====
    { path: 'home', component: HomeComponent },

    {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard],
        data: { hideChrome: true, title: 'Đăng nhập | TechNoX' }
    },
    {
        path: 'signup',
        component: SignupComponent,
        canActivate: [loginGuard],
        data: { hideChrome: true, title: 'Đăng ký | TechNoX' }
    },

    {
        path: 'verify-email',
        loadComponent: () =>
            import('./components/Component-function/verify-email/verify-email.component')
                .then(m => m.VerifyEmailComponent),
        data: { hideChrome: true, title: 'Xác minh email | TechNoX' }
    },
    {
        path: 'verify-email/pending',
        loadComponent: () =>
            import('./components/Component-function/verify-pending/verify-pending.component')
                .then(m => m.VerifyPendingComponent),
        data: { hideChrome: true, title: 'Đang chờ xác minh | TechNoX' }
    },
    { path: 'forgot-password', component: ForgotPasswordComponent, data: { hideChrome: true, title: 'Quên mật khẩu | TechNoX' } },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./components/Component-login/reset-password/reset-password.component')
                .then(m => m.ResetPasswordComponent),
        title: 'Đặt lại mật khẩu | TechNoX',
        data: { hideChrome: true }
    },

    { path: 'products', component: ProductPageComponent },
    { path: 'cart', component: CartComponent },
    {
        path: 'product/:id',
        loadComponent: () =>
            import('./components/Component-product/detail-product/detail-product.component')
                .then(m => m.DetailProductComponent),
    },
    {
        path: 'user/:id',
        loadComponent: () =>
            import('./components/Component-home/detail-user/detail.user')
                .then(m => m.DetailUserComponent)
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./components/Component-home/detail-user/detail.user')
                .then(m => m.DetailUserComponent)
    },

    // ===== Legal =====
    {
        path: 'legal',
        loadComponent: () =>
            import('./components/Component-owner/owner/legal/legal-layout/legal-layout.component')
                .then(m => m.LegalLayoutComponent),
        children: [
            {
                path: 'about',
                loadComponent: () =>
                    import('./components/Component-owner/owner/legal/about/about.component')
                        .then(m => m.AboutComponent),
                title: 'Giới thiệu | TechNoX'
            },
            {
                path: 'privacy-policy',
                loadComponent: () =>
                    import('./components/Component-owner/owner/legal/privacy-policy/privacy-policy.component')
                        .then(m => m.PrivacyPolicyComponent),
                title: 'Chính sách bảo mật | TechNoX'
            },
            {
                path: 'terms',
                loadComponent: () =>
                    import('./components/Component-owner/owner/legal/terms/terms.component')
                        .then(m => m.TermsComponent),
                title: 'Điều khoản sử dụng | TechNoX'
            },
            {
                path: 'warranty',
                loadComponent: () =>
                    import('./components/Component-owner/owner/legal/warranty/warranty.component')
                        .then(m => m.WarrantyComponent),
                title: 'Chính sách bảo hành | TechNoX'
            },
            {
                path: 'returns',
                loadComponent: () =>
                    import('./components/Component-owner/owner/legal/returns/returns.component')
                        .then(m => m.ReturnsComponent),
                title: 'Hủy giao dịch, đổi trả | TechNoX'
            },
            { path: '', redirectTo: 'about', pathMatch: 'full' }
        ]
    },

    // ===== Staff (Giao hàng) =====
    {
        path: 'staff/shipping',
        loadComponent: () =>
            import('./components/Component-Staff/Shipping/Order-shipping')
                .then(m => m.OrderShippingComponent),
        title: 'Giao hàng | Nhân viên',
    },

    // ===== Owner (bật guard) =====
    {
        path: 'owner',
        canActivate: [ownerGuard], // << đã bật lại
        loadComponent: () =>
            import('./components/Component-owner/owner/layout/owner-layout.component')
                .then(m => m.OwnerLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./components/Component-owner/owner/dashboard/dashboard.component')
                        .then(m => m.DashboardComponent),
                title: 'Tổng quan | Owner'
            },

            // Quản lý đơn hàng (frontend-only, standalone)
            {
                path: 'orders',
                loadComponent: () =>
                    import('./components/Component-owner/owner/OrderControll/order-controll')
                        .then(m => m.OrderControllComponent),
                title: 'Quản lý đơn hàng | Owner'
            },
            {
                path: 'orders/:id',
                loadComponent: () =>
                    import('./components/Component-owner/owner/OrderControll/orders-detail/orders-detail.component')
                        .then(m => m.OrdersDetailComponent),
                title: 'Quản lý đơn hàng | Owner'
            },


            {
                path: 'products',
                loadComponent: () =>
                    import('./components/Component-owner/owner/products/products-list/products-list.component')
                        .then(m => m.ProductsListComponent),
                title: 'Quản lý sản phẩm | Owner'
            },
            {
                path: 'products/new',
                loadComponent: () =>
                    import('./components/Component-owner/owner/products/products-detail/products-detail.component')
                        .then(m => m.ProductsDetailComponent),
                title: 'Thêm sản phẩm | Owner'
            },
            {
                // lưu ý: đường dẫn này hiện là '/owner/owner/products/:id/edit' vì đang ở dưới 'owner'
                // nếu bạn muốn '/owner/products/:id/edit', đổi 'owner/products/:id/edit' -> 'products/:id/edit'
                path: 'owner/products/:id/edit',
                loadComponent: () =>
                    import('./components/Component-owner/owner/products/products-detail/products-detail.component')
                        .then(m => m.ProductsDetailComponent)
            },
            {
                path: 'products/:id',
                loadComponent: () =>
                    import('./components/Component-owner/owner/products/products-detail/products-detail.component')
                        .then(m => m.ProductsDetailComponent),
                title: 'Sửa sản phẩm | Owner'
            },
            {
                path: 'users',
                loadComponent: () =>
                    import('./components/Component-owner/owner/users/users-list/users-list.component')
                        .then(m => m.UsersListComponent),
                title: 'Người dùng của TechNoX'
            },
            {
                path: 'users/:id',
                loadComponent: () =>
                    import('./components/Component-owner/owner/users/users-detail/users-detail.component')
                        .then(m => m.UserDetailComponent)
            }
        ]
    },

    { path: '**', redirectTo: 'home' }
];