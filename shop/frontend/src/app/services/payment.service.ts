import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CartItemAPI { id: string; name: string; price: number; qty: number; }
export interface UserAPI { id: string; fullName: string; email?: string; }
export interface CustomerAPI { address?: string; phone?: string; }

export interface PayOSLinkResponse {
    billId: number;
    orderCode: number;
    amount: number;
    checkoutUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiPrefix = '/api/v1';

    constructor(private http: HttpClient) { }

    getCart(): Observable<CartItemAPI[]> {
        return this.http.get<CartItemAPI[]>(`${this.apiPrefix}/cart`);
    }

    getMe(): Observable<UserAPI> {
        return this.http.get<UserAPI>(`${this.apiPrefix}/users/me`);
    }

    getCustomer(): Observable<CustomerAPI> {
        return this.http.get<CustomerAPI>(`${this.apiPrefix}/customer`);
    }

    createPayOSLink(billId: string): Observable<PayOSLinkResponse> {
        // Gọi API an toàn mà chúng ta đã tạo trong BillController
        return this.http.post<PayOSLinkResponse>(
            `${this.apiPrefix}/bills/${billId}/pay`,
            {} // Body rỗng, vì server sẽ tự xử lý
        );
    }
}
