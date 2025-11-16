// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app/app';
import { ToastService } from './app/shared/toast/toast.service';
import { NgZone } from '@angular/core';

function patchAlert(toast: ToastService, zone: NgZone) {
    const w = window as any;
    if (w.__alertPatched) return;

    w.__originalAlert = window.alert.bind(window);
    w.__alertPatched = true;

    window.alert = (message?: any) => {
        const msg = message == null ? '' : String(message);

        // chạy trong Angular zone để trigger change detection
        zone.run(() => {
            if (/^error[:\-]/i.test(msg))            toast.error(msg.replace(/^error[:\-]\s*/i, ''));
            else if (/^(ok|success)[:\-]/i.test(msg)) toast.success(msg.replace(/^(ok|success)[:\-]\s*/i, ''));
            else                                      toast.info(msg);
        });
    };
}

bootstrapApplication(App, appConfig)
    .then(appRef => {
        const injector = appRef.injector;
        const toast = injector.get(ToastService);
        const zone  = injector.get(NgZone);
        patchAlert(toast, zone);
    })
    .catch(err => console.error(err));
