import {
    ApplicationConfig, importProvidersFrom,
    LOCALE_ID,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection
} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {authInterceptor} from "./interceptors/auth.interceptor";
import { LucideAngularModule, TrendingUp, TrendingDown } from 'lucide-angular';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi, 'vi-VN');

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({eventCoalescing: true}),
        provideHttpClient(withInterceptors([authInterceptor])),
        //scroll
        provideRouter(
            routes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
        ),
        importProvidersFrom(
            LucideAngularModule.pick({ TrendingUp, TrendingDown })
        ),
        { provide: LOCALE_ID, useValue: 'vi-VN' }
    ],
};
