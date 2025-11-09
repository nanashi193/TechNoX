import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from './toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    encapsulation: ViewEncapsulation.None, // global CSS để không bị đè
    template: `
        <div class="g5-toast-wrap g5-toast-wrap--top">
            <div class="g5-toast"
                 *ngFor="let t of toasts"
                 [class.g5-success]="t.type==='success'"
                 [class.g5-error]="t.type==='error'"
                 [class.g5-info]="t.type==='info'"
                 role="status" aria-live="polite">
                {{ t.message }}
            </div>
        </div>
    `,
    styles: [`
        /* GÓC PHẢI TRÊN + xếp từ TRÊN xuống */
        .g5-toast-wrap{
            position: fixed !important;
            top: 20px !important;
            right: 24px !important;
            bottom: auto !important;
            left: auto !important;

            display: flex !important;
            flex-direction: column !important;   /* xếp theo cột */
            align-items: flex-start !important;  /* bám cạnh phải khi wrap rộng */
            gap: 14px !important;

            z-index: 2147483647 !important;
            pointer-events: none !important;
        }

        /* TO hơn – dễ đọc hơn */
        .g5-toast{
            pointer-events: auto !important;
            width: clamp(380px, 45vw, 640px) !important;   /* min 380, max 640 */
            padding: 16px 20px !important;
            background: rgba(255,255,255,0.98) !important;
            color: #0f172a !important;
            border-radius: 16px !important;
            border-left: 8px solid #64748b !important;
            box-shadow: 0 16px 40px rgba(0,0,0,.28) !important;

            font-size: 18px !important;
            line-height: 1.55 !important;
            letter-spacing: .2px !important;

            animation: g5-drop .18s ease-out !important;   /* rơi từ trên xuống */
        }
        .g5-toast.g5-success { border-left-color: #22c55e !important; }
        .g5-toast.g5-error   { border-left-color: #ef4444 !important; }
        .g5-toast.g5-info    { border-left-color: #3b82f6 !important; }

        @keyframes g5-drop{
            from { transform: translateY(-10px); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
        }

        /* MOBILE: gần full-width, sát mép trên */
        @media (max-width: 600px){
            .g5-toast-wrap{
                top: 12px !important;
                right: 12px !important;
                left: 12px !important;
                align-items: stretch !important;
            }
            .g5-toast{
                width: 100% !important;
                padding: 14px 16px !important;
                font-size: 16.5px !important;
                border-left-width: 6px !important;
            }
        }
    `]
})
export class ToastContainerComponent implements OnDestroy {
    toasts: Toast[] = [];
    private sub = new Subscription();

    constructor(private toast: ToastService){
        this.sub.add(
            this.toast.toasts$.subscribe(t => {
                // NEWEST ON TOP: thêm vào đầu mảng để toast mới hiện trên cùng
                this.toasts = [t, ...this.toasts];
                const ms = t.duration ?? 3000;
                setTimeout(() => {
                    this.toasts = this.toasts.filter(x => x.id !== t.id);
                }, ms);
            })
        );
    }

    ngOnDestroy(){ this.sub.unsubscribe(); }
}
