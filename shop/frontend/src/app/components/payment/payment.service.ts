// shop/frontend/src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    CartItem,
    User,
    Customer,
    CreatePayOSLinkPayload,
    CreatePayOSLinkResponse,
} from '../../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
    constructor(private http: HttpClient) {}

    /**
     * Nếu backend dùng cookie/session (Set-Cookie) cho xác thực,
     * giữ withCredentials = true. Nếu bạn dùng JWT qua header,
     * đổi thành {} hoặc bỏ tham số this.opts ở các lệnh http.
     */
    private readonly opts = { withCredentials: true };

    getCart(): Observable<CartItem[]> {
        return this.http.get<CartItem[]>('/api/cart', this.opts);
    }

    getMe(): Observable<User> {
        return this.http.get<User>('/api/me', this.opts);
    }

    getCustomer(): Observable<Customer> {
        return this.http.get<Customer>('/api/customer', this.opts);
    }

    createPayOSLink(data: CreatePayOSLinkPayload): Observable<CreatePayOSLinkResponse> {
        return this.http.post<CreatePayOSLinkResponse>(
            '/api/payments/payos/link',
            data,
            this.opts
        );
    }
}
