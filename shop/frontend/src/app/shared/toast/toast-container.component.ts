import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from './toast.service';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule, RouterModule],
    encapsulation: ViewEncapsulation.None, // global CSS để không bị đè
    template: `
        <!-- Vùng chứa, đặt ở góc trên phải -->
        <div class="g5-toast-wrap g5-toast-wrap--top">

            <!-- V(ngFor) duyệt qua các toast -->
            <div class="g5-toast"
                 *ngFor="let t of toasts"
                 [class.g5-success]="t.type==='success'"
                 [class.g5-error]="t.type==='error'"
                 [class.g5-info]="t.type==='info'"
                 role="status" aria-live="polite">

                <!-- 1. Tin nhắn (luôn hiển thị) -->
                <span class="g5-toast-message">{{ t.message }}</span>

                <!-- 2. Nút "Xem" (chỉ hiển thị khi có link) -->
                <a *ngIf="t.link"
                   [routerLink]="t.link"
                   (click)="removeToast(t.id)"
                   class="g5-toast-link">
                    Xem
                </a>

                <!-- 3. Nút đóng (X) -->
                <button (click)="removeToast(t.id)" class="g5-toast-close" aria-label="Đóng">×</button>
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
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
        }

        /* ----- BẮT ĐẦU SỬA CSS ----- */
        .g5-toast{
            pointer-events: auto !important;
            width: clamp(380px, 45vw, 640px) !important;
            padding: 16px 20px !important;
            background: rgba(255,255,255,0.98) !important;
            color: #0f172a !important;
            border-radius: 16px !important;
            border-left: 8px solid #64748b !important;
            box-shadow: 0 16px 40px rgba(0,0,0,.28) !important;

            /* 1. Dùng Flexbox để xếp các item */
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important; /* Đẩy các item ra xa */
            gap: 12px !important;

            animation: g5-drop .18s ease-out !important;
        }

        /* 2. Tin nhắn (chiếm phần lớn) */
        .g5-toast-message {
            font-size: 18px !important;
            line-height: 1.55 !important;
            letter-spacing: .2px !important;
            flex-grow: 1; /* Cho phép tin nhắn co giãn */
        }

        /* 3. Nút "Xem" (thêm vào) */
        .g5-toast-link {
            font-size: 17px !important;
            font-weight: 600 !important;
            color: #3b82f6 !important; /* Màu xanh info */
            text-decoration: none !important;
            padding: 4px 8px !important;
            border-radius: 6px !important;
            flex-shrink: 0; /* Không co lại */
        }
        .g5-toast-link:hover {
            background-color: rgba(59, 130, 246, 0.1) !important;
        }

        /* 4. Nút đóng (X) (thêm vào) */
        .g5-toast-close {
            background: none !important;
            border: none !important;
            color: #94a3b8 !important;
            font-size: 24px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            padding: 0 4px !important;
            line-height: 1 !important;
            flex-shrink: 0; /* Không co lại */
        }
        .g5-toast-close:hover {
            color: #334155 !important;
        }

        /* ----- KẾT THÚC SỬA CSS ----- */

        .g5-toast.g5-success { border-left-color: #22c55e !important; }
        .g5-toast.g5-error   { border-left-color: #ef4444 !important; }
        .g5-toast.g5-info    { border-left-color: #3b82f6 !important; }
        .g5-toast.g5-info .g5-toast-link { color: #3b82f6 !important; }
        .g5-toast.g5-success .g5-toast-link { color: #22c55e !important; }
        .g5-toast.g5-error .g5-toast-link { color: #ef4444 !important; }


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
                border-left-width: 6px !important;
            }
            .g5-toast-message { font-size: 16.5px !important; }
            .g5-toast-link { font-size: 16px !important; }
        }
    `]
})
export class ToastContainerComponent implements OnDestroy {
    toasts: (Toast & { link?: string | null })[] = []; // Cho phép 'link' ở đây
    private sub = new Subscription();

    constructor(private toast: ToastService){
        this.sub.add(
            this.toast.toasts$.subscribe(t => {
                // NEWEST ON TOP: thêm vào đầu mảng để toast mới hiện trên cùng
                this.toasts = [t, ...this.toasts];
                const ms = t.duration ?? 3000;

                // Tự động xóa sau (ms) giây
                setTimeout(() => {
                    this.removeToast(t.id);
                }, ms);
            })
        );
    }

    // Thêm hàm này để cho phép đóng bằng tay (hoặc khi bấm link)
    removeToast(id: number) {
        this.toasts = this.toasts.filter(x => x.id !== id);
    }

    ngOnDestroy(){ this.sub.unsubscribe(); }
}