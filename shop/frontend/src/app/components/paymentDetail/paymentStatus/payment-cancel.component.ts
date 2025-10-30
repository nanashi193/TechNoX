import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-payment-cancel',
    imports: [CommonModule, RouterModule],
    template: `
        <div class="frame">
            <div class="card">
                <h3>Thanh toán đã hủy</h3>
                <p>Mã đơn: <b>{{ orderId }}</b></p>
                <a class="btn" routerLink="/payment">Thử thanh toán lại</a>
            </div>
        </div>
    `
})
export class PaymentCancelComponent implements OnInit {
    orderId = '—';

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.orderId = this.route.snapshot.queryParamMap.get('orderId') ?? '—';
        // hoặc theo dõi thay đổi:
        // this.route.queryParamMap.subscribe(q => this.orderId = q.get('orderId') ?? '—');
    }
}
