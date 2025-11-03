import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {AuthService} from '../../../services/auth.service';

@Component({
    standalone: true,
    selector: 'app-verify-pending',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './verify-pending.component.html',
    styleUrls: ['./verify-pending.component.css', '../../../styles/shared-styles.css']
})
export class VerifyPendingComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private auth = inject(AuthService);

    form: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    });

    loading = false;
    successMsg: string | null = null;
    errorMsg: string | null = null;

    // === Cooldown 30s ===
    cooldown = 0;                       // số giây còn lại
    private timer?: any;
    private COOLDOWN_KEY = 'verify_resend_cooldown_until'; // lưu timestamp (ms) vào localStorage

    get emailCtrl(): FormControl {
        return this.form.get('email') as FormControl;
    }

    ngOnInit() {
        // Prefill email
        const qpEmail = this.route.snapshot.queryParamMap.get('email');
        const saved = localStorage.getItem('pendingEmail');
        const email = qpEmail || saved;
        if (email) this.form.patchValue({email});

        // Khởi chạy cooldown: nếu có timestamp cũ và còn hiệu lực → dùng tiếp; nếu không → set 30s từ bây giờ
        const savedUntil = Number(localStorage.getItem(this.COOLDOWN_KEY));
        const now = Date.now();
        const until = !isNaN(savedUntil) && savedUntil > now ? savedUntil : now + 30_000;
        localStorage.setItem(this.COOLDOWN_KEY, String(until));
        this.startCooldown(until);
        this.updateEmailDisabledState();
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    private startCooldown(untilMs: number) {
        if (this.timer) clearInterval(this.timer);

        const tick = () => {
            const now = Date.now();
            const remain = Math.max(0, Math.ceil((untilMs - now) / 1000));
            this.cooldown = remain;
            this.updateEmailDisabledState();
            if (remain === 0) {
                clearInterval(this.timer);
                this.timer = undefined;
                localStorage.removeItem(this.COOLDOWN_KEY);
                this.updateEmailDisabledState();
            }
        };
        tick();
        this.timer = setInterval(tick, 1000);
    }

    private updateEmailDisabledState() {
        const shouldDisable = this.loading || this.cooldown > 0;
        const ctrl = this.emailCtrl;
        if (shouldDisable && !ctrl.disabled) ctrl.disable({emitEvent: false});
        if (!shouldDisable && ctrl.disabled) ctrl.enable({emitEvent: false});
    }

    resend() {
        this.successMsg = this.errorMsg = null;

        // chặn bấm khi form invalid / đang loading / còn cooldown
        if (this.form.invalid || this.loading || this.cooldown > 0) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.updateEmailDisabledState(); //khoa khi gui

        this.auth.resendVerification(this.emailCtrl.value)
            .pipe(finalize(() => {
                this.loading = false;
               this.updateEmailDisabledState(); //mo (hoac van khoa khi con cooldown)
            }))
            .subscribe({
                next: (res) => {
                    this.successMsg = 'Nếu email hợp lệ, chúng tôi đã gửi lại liên kết xác minh.';

                    // ⬇ Nếu BE trả JSON có token → mở ngay trang verify
                    const token = (res as any)?.token;
                    if (token) {
                        this.router.navigate(['/verify-email'], { queryParams: { token } });
                        return;
                    }
                    const until = Date.now() + 30_000;
                    localStorage.setItem(this.COOLDOWN_KEY, String(until));
                    this.startCooldown(until); // se tu goi updateEmailDisabledStable
                },
                error: () => {
                    // vẫn hiển thị thông điệp trung tính
                    this.successMsg = 'Nếu email hợp lệ, chúng tôi đã gửi lại liên kết xác minh.';
                    const until = Date.now() + 30_000;
                    localStorage.setItem(this.COOLDOWN_KEY, String(until));
                    this.startCooldown(until);
                }
            });
    }
}
