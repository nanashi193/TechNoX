import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

type CartItem = { id: string | number; name: string; price: number; qty: number };

@Component({
    selector: 'app-payment-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-component.html',
    styleUrls: ['./payment-component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent implements OnInit, OnDestroy {
    // --- Cart & order ---
    items: CartItem[] = [];
    subtotal = 0;               // VND (integer)
    orderId = '';               // mã đơn
    private lastSubtotal = -1;

    // --- QR state ---
    qrSrc: string | null = null;
    qLoading = false;
    qError: string | null = null;

    /** Thông tin chủ shop (MB Bank) */
    readonly merchant = {
        bin: '970422',
        code: 'MBBank',
        short: 'MB',
        alt: 'mbbank',
        accountNumber: '0853907917',
        accountName: 'PHAM HIEU NGHIA',
    };

    // --- nội bộ ---
    private runId = 0;                 // chống race giữa các lần refresh
    private destroyed = false;         // cleanup khi destroy
    private retryTimers: number[] = []; // giữ id setTimeout để clear
    private onlineHandler = () => {
        if (!this.qrSrc && !this.qLoading && this.items.length) this.refresh();
    };
    private visibilityHandler = () => {
        if (document.visibilityState === 'visible' && !this.qrSrc && !this.qLoading && this.items.length) this.refresh();
    };

    constructor(private cdr: ChangeDetectorRef) {}

    // ==== AUTO BOOT ====
    ngOnInit(): void {
        this.bootAuto(); // vào trang là tự có QR (nếu giỏ hàng không trống)
    }
    ngOnDestroy(): void {
        this.destroyed = true;
        this.retryTimers.forEach(id => clearTimeout(id));
        this.retryTimers = [];
        window.removeEventListener('online', this.onlineHandler);
        document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    private bootAuto(): void {
        // 1) Gọi ngay
        this.refresh();
        // 2) Gọi lại sau render frame đầu (đề phòng lần đầu chưa kịp hydrate state)
        const t0 = setTimeout(() => {
            if (!this.qrSrc && !this.qLoading && this.items.length) this.refresh();
        }, 0);
        this.retryTimers.push(t0 as unknown as number);

        // 3) Backoff nhẹ nếu vẫn chưa có (mạng chậm)
        [1500, 3000, 6000].forEach(ms => {
            const tid = setTimeout(() => {
                if (!this.qrSrc && !this.qLoading && this.items.length) this.refresh();
            }, ms);
            this.retryTimers.push(tid as unknown as number);
        });

        // 4) Tự thử lại khi có mạng / tab quay lại
        window.addEventListener('online', this.onlineHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    trackByCartItem(i: number, it: CartItem) { return it?.id ?? i; }

    /** Nạp giỏ + tính tổng + preload QR (song song + nhớ bankId thành công) */
    async refresh(): Promise<void> {
        // 1) Đồng bộ dữ liệu giỏ hàng
        const items = this.readCart();
        const subtotal = Math.round(items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0));
        this.items = items;
        this.subtotal = subtotal;

        // 2) Tạo/đổi orderId nếu lần đầu hoặc tổng thay đổi
        if (!this.orderId || this.lastSubtotal !== this.subtotal) {
            this.orderId = this.makeOrderId();
            this.lastSubtotal = this.subtotal;
        }

        // Nếu giỏ trống thì thôi
        if (!this.items.length) {
            this.qrSrc = null; this.qError = null; this.qLoading = false;
            this.cdr.markForCheck();
            return;
        }

        // 3) Params QR
        const params = new URLSearchParams();
        if (this.subtotal > 0) params.set('amount', String(this.subtotal));
        params.set('addInfo', this.safeAddInfo(`Thanh toan ${this.orderId}`));
        params.set('accountName', this.merchant.accountName);
        const tail = `compact.png?${params.toString()}`;

        // 4) Thứ tự bankId: prefer id từng thành công -> 'mbbank' -> 'MB' -> 'MBBank' -> BIN
        const preferred = localStorage.getItem('vietqr_bankid') || 'mbbank';
        const bankIds = Array.from(new Set([preferred, 'mbbank', 'MB', 'MBBank', '970422']));
        const candidates = bankIds.map(
            b => `https://img.vietqr.io/image/${encodeURIComponent(b)}-${encodeURIComponent(this.merchant.accountNumber)}-${tail}`
        );

        // 5) Trạng thái tải
        const id = ++this.runId;
        this.qLoading = true; this.qError = null; this.qrSrc = null; this.cdr.markForCheck();

        // 6) Tải song song, lấy cái về trước
        const working = await this.findWorkingImageFast(candidates, 10000);
        if (this.destroyed || this.runId !== id) return;

        this.qLoading = false;
        if (working) {
            this.qrSrc = working;
            // lưu bankId đã thành công
            try {
                const pathPart = working.split('/image/')[1] ?? '';
                const hitId = pathPart.split('-')[0];
                if (hitId) localStorage.setItem('vietqr_bankid', hitId);
            } catch { /* no-op */ }
        } else {
            this.qError = 'Không tải được QR (mạng/CSP/bankId).';
        }
        this.cdr.markForCheck();
    }

    /** Tải 1 ảnh với timeout. Trả về URL nếu OK, null nếu fail */
    private loadImageWithTimeout(url: string, timeoutMs = 10000): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            const img = new Image();
            let done = false;
            const finish = (ok: boolean) => {
                if (done) return;
                done = true;
                clearTimeout(tid);
                img.onload = null;
                img.onerror = null;
                resolve(ok ? url : null);
            };
            const tid = setTimeout(() => finish(false), timeoutMs);
            img.onload = () => finish(true);
            img.onerror = () => finish(false);
            img.src = url;
        });
    }

    /** Promise.any đơn giản: trả về URL đầu tiên load được, hoặc null nếu tất cả fail */
    private async findWorkingImageFast(urls: string[], perUrlTimeoutMs = 10000): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            let pending = urls.length;
            let settled = false;
            for (const u of urls) {
                this.loadImageWithTimeout(u, perUrlTimeoutMs).then(hit => {
                    if (settled) return;
                    if (hit) { settled = true; resolve(hit); }
                    if (--pending === 0 && !settled) resolve(null);
                });
            }
        });
    }

    /** Đọc giỏ hàng từ localStorage (sanitize) */
    private readCart(): CartItem[] {
        try {
            const raw = localStorage.getItem('cart');
            const arr: any[] = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) return [];
            return arr.map(x => ({
                id: String(x?.id ?? ''),
                name: String(x?.name ?? 'Sản phẩm'),
                price: Number(x?.price ?? 0),
                qty: Number(x?.qty ?? 0),
            }));
        } catch { return []; }
    }

    /** Mã đơn pseudo-unique: thời gian base36 + random base36 */
    private makeOrderId(): string {
        const t = Date.now().toString(36).toUpperCase();
        const r = Math.floor(Math.random() * 1e6).toString(36).toUpperCase().padStart(4, '0');
        return `ORD-${t}-${r}`;
    }

    /** ASCII an toàn + giới hạn độ dài cho addInfo */
    private safeAddInfo(s: string): string {
        const ascii = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
        return ascii.slice(0, 60);
    }

    // ==== tiện ích ====
    downloadQR(): void {
        if (!this.qrSrc) return;
        const a = document.createElement('a');
        a.href = this.qrSrc;
        a.download = `vietqr-${this.orderId}.png`;
        a.click();
    }

    copyAddInfo(): void {
        const info = this.safeAddInfo(`Thanh toan ${this.orderId}`);
        navigator.clipboard?.writeText(info).catch(() => {/* ignore */});
    }

    /** In QR qua iframe ẩn để tránh popup blocker */
    printQR(): void {
        if (!this.qrSrc) return;
        const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>VietQR</title>
<style>
@page{ size:A5; margin:10mm }
body{ font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; color:#111; }
.box{ max-width:420px; margin:0 auto; text-align:center; }
img{ width:100%; }
h3{ margin:6px 0 8px }
.meta{ margin-top:10px; font-size:14px; text-align:left; }
.meta b{ font-weight:700 }
.muted{ color:#666 }
</style></head><body>
<div class="box">
  <img src="${this.qrSrc}" alt="VietQR chuyển khoản ngân hàng cho đơn ${this.orderId}">
  <h3>QR Chuyển khoản ngân hàng</h3>
  <div class="meta">
    <div><b>Đơn hàng:</b> ${this.orderId}</div>
    <div><b>Ngân hàng:</b> MB Bank</div>
    <div><b>Chủ TK:</b> ${this.merchant.accountName}</div>
    <div><b>Số TK:</b> ${this.merchant.accountNumber}</div>
    <div class="muted">QR theo chuẩn VietQR/NAPAS 24/7</div>
  </div>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`;
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0'; iframe.style.bottom = '0';
        iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument!;
        doc.open(); doc.write(html); doc.close();
        iframe.onload = () => setTimeout(() => {
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 250);
    }
}
