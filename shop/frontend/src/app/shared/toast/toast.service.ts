import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private seq = 0;
    private _toasts$ = new Subject<Toast>();
    readonly toasts$ = this._toasts$.asObservable();

    constructor() {
        // DEBUG: expose để gọi từ console
        (window as any).__showToast = (msg: string, type: ToastType = 'info', duration = 2500) => {
            console.log('[ToastService] __showToast', { msg, type, duration });
            this.show(msg, type, duration);
        };
    }

    show(message: string, type: ToastType = 'info', duration = 2500) {
        this._toasts$.next({ id: ++this.seq, message, type, duration });
    }
    success(msg: string, duration?: number) { this.show(msg, 'success', duration); }
    error(msg: string, duration?: number)   { this.show(msg, 'error', duration); }
    info(msg: string, duration?: number)    { this.show(msg, 'info', duration); }
}
