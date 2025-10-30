import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-payment-success',
    imports: [CommonModule, RouterModule],
    template: `
        <div class="frame">
            <div class="card success">
                <h3>Thanh toán thành công</h3>
                <p>Mã đơn: <b>{{ orderId }}</b></p>
                <a class="btn" routerLink="/home">Về trang chủ</a>
            </div>
        </div>
    `
})
export class PaymentSuccessComponent implements OnInit {
    orderId = '—';

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '—';
    }
}
