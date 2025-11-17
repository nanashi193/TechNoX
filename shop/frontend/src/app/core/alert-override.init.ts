import { APP_INITIALIZER, Provider } from '@angular/core';
import { ToastService } from '../shared/toast/toast.service'; // ⬅️ path theo ảnh bạn gửi

export function alertInitializerFactory(toast: ToastService) {
    return () => {
        if (typeof window !== 'undefined' && !(window as any).__alertPatched) {
            (window as any).__originalAlert = window.alert.bind(window);
            (window as any).__alertPatched = true;

            window.alert = (message?: any) => {
                const msg = message == null ? '' : String(message);
                if (/^error[:\-]/i.test(msg))       toast.error(msg.replace(/^error[:\-]\s*/i, ''));
                else if (/^(ok|success)[:\-]/i.test(msg)) toast.success(msg.replace(/^(ok|success)[:\-]\s*/i, ''));
                else                                toast.info(msg);
            };
        }
    };
}

export const ALERT_OVERRIDE_PROVIDER: Provider = {
    provide: APP_INITIALIZER,
    useFactory: alertInitializerFactory,
    deps: [ToastService],
    multi: true,
};
