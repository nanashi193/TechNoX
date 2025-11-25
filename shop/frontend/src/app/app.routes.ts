import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { HomeComponent } from './components/Component-home/home/home.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ProductPageComponent } from './components/Component-product/product/product-page.component';
import { CartComponent } from './components/cart/cart/cart.component';
import { loginGuard } from './guards/login.guard';
import { ownerGuard } from './guards/owner.guard';

// Payment detail (component thường)
import { PaymentDetailComponent } from './components/Component-payment/paymentInfor/payment-detail.component';
import {OrderShippingComponent} from "./components/staff/Shipping/Order-shipping";
import {StaffAssignOrdersComponent} from "./components/staff/staff/staff-assign-orders.component";

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    // ===== Payment (lazy) =====
    {
        path: 'payment',
        loadComponent: () =>
            import('./components/Component-payment/payment/payment-component')
                .then(m => m.PaymentComponent),
        title: 'Thanh toán | TechNoZ'
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
    { path: 'payment-detail', component: PaymentDetailComponent, data: { title: 'Chi tiết đơn hàng | TechNoZ' } },
    { path: 'checkout', redirectTo: 'payment', pathMatch: 'full' },

    // ===== Public =====
    { path: 'home', component: HomeComponent },

    {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard],
        data: { hideChrome: true, title: 'Đăng nhập | TechNoZ' }
    },
    {
        path: 'signup',
        component: SignupComponent,
        canActivate: [loginGuard],
        data: { hideChrome: true, title: 'Đăng ký | TechNoZ' }
    },

    {
        path: 'verify-email',
        loadComponent: () =>
            import('./components/function/verify-email/verify-email.component')
                .then(m => m.VerifyEmailComponent),
        data: { hideChrome: true, title: 'Xác minh email | TechNoZ' }
    },
    {
        path: 'verify-email/pending',
        loadComponent: () =>
            import('./components/function/verify-pending/verify-pending.component')
                .then(m => m.VerifyPendingComponent),
        data: { hideChrome: true, title: 'Đang chờ xác minh | TechNoZ' }
    },
    { path: 'forgot-password', component: ForgotPasswordComponent, data: { hideChrome: true, title: 'Quên mật khẩu | TechNoZ' } },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./components/auth/reset-password/reset-password.component')
                .then(m => m.ResetPasswordComponent),
        title: 'Đặt lại mật khẩu | TechNoZ',
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

    // ===== My Orders (KHÁCH HÀNG) =====
    {
        path: 'my-orders',
        loadComponent: () =>
            import('./components/Component-MyOrder/Component-MyOrder')
                .then(m => m.ComponentMyOrderComponent),
        title: 'Đơn hàng của tôi | TechNoZ'
    },

    // ===== Legal =====
    {
        path: 'legal',
        loadComponent: () =>
            import('./components/owner/legal/legal-layout/legal-layout.component')
                .then(m => m.LegalLayoutComponent),
        children: [
            {
                path: 'about',
                loadComponent: () =>
                    import('./components/owner/legal/about/about.component')
                        .then(m => m.AboutComponent),
                title: 'Giới thiệu | TechNoZ'
            },
            {
                path: 'privacy-policy',
                loadComponent: () =>
                    import('./components/owner/legal/privacy-policy/privacy-policy.component')
                        .then(m => m.PrivacyPolicyComponent),
                title: 'Chính sách bảo mật | TechNoZ'
            },
            {
                path: 'terms',
                loadComponent: () =>
                    import('./components/owner/legal/terms/terms.component')
                        .then(m => m.TermsComponent),
                title: 'Điều khoản sử dụng | TechNoZ'
            },
            {
                path: 'warranty',
                loadComponent: () =>
                    import('./components/owner/legal/warranty/warranty.component')
                        .then(m => m.WarrantyComponent),
                title: 'Chính sách bảo hành | TechNoZ'
            },
            {
                path: 'returns',
                loadComponent: () =>
                    import('./components/owner/legal/returns/returns.component')
                        .then(m => m.ReturnsComponent),
                title: 'Hủy giao dịch, đổi trả | TechNoZ'
            },
            { path: '', redirectTo: 'about', pathMatch: 'full' }
        ]
    },

    // ===== Staff (Giao hàng) =====
    {
        path: 'staff',
        children: [
            { path: 'assign-orders', component: StaffAssignOrdersComponent },  // ← Gán đơn
            { path: 'shipping', component: OrderShippingComponent },  // ← Shipping_Staff + Receiving
            { path: '', redirectTo: 'shipping', pathMatch: 'full' }
        ]
    },

    // ===== Owner (bật guard) =====
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

            // Quản lý đơn hàng (frontend-only, standalone)
            {
                path: 'orders',
                loadComponent: () =>
                    import('./components/owner/OrderControll/order-controll')
                        .then(m => m.OrderControllComponent),
                title: 'Quản lý đơn hàng | Owner'
            },
            {
                path: 'orders/:billId',
                loadComponent: () =>
                    import('./components/owner/OrderControll/orders-detail/orders-detail.component')
                        .then(m => m.OrdersDetailComponent),
                title: 'Chi tiết đơn hàng | Owner'
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
                // lưu ý: đường dẫn này hiện là '/owner/owner/products/:id/edit' vì đang ở dưới 'owner'
                // nếu bạn muốn '/owner/products/:id/edit', đổi 'owner/products/:id/edit' -> 'products/:id/edit'
                path: 'owner/products/:id/edit',
                loadComponent: () =>
                    import('./components/owner/products/products-detail/products-detail.component')
                        .then(m => m.ProductsDetailComponent)
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
                title: 'Người dùng của TechNoZ'
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
