import {
    ApplicationConfig, importProvidersFrom,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection
} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {authInterceptor} from "./interceptors/auth.interceptor";
import { LucideAngularModule, TrendingUp, TrendingDown } from 'lucide-angular';
export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({eventCoalescing: true}),
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        //scroll
        provideRouter(
            routes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
        ),
        importProvidersFrom(
            LucideAngularModule.pick({ TrendingUp, TrendingDown })
        ),
    ],
};
