import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const ownerGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn() && auth.hasRole('OWNER')) return true;

    router.navigate(['/login'], { queryParams: { returnUrl: '/owner' } });
    return false;
};
