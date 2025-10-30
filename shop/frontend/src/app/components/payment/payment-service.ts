import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
}

interface User {
    id: string;
    fullName: string;
    email?: string;
}

interface Customer {
    cccd?: string;
    address?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
    constructor(private http: HttpClient) {}

    getCart(): Observable<CartItem[]> {
        return this.http.get<CartItem[]>('/api/cart');
        // Tùy backend, có thể là /api/cart/current
    }

    getMe(): Observable<User> {
        return this.http.get<User>('/api/me');
    }

    getCustomer(): Observable<Customer> {
        return this.http.get<Customer>('/api/customer');
    }

    createPayOSLink(data: {
        orderCode: number;
        amount: number;
        description: string;
        returnUrl: string;
        cancelUrl: string;
        items: { name: string; quantity: number; price: number }[];
        buyer?: { name?: string; address?: string; email?: string };
    }): Observable<{ checkoutUrl: string }> {
        return this.http.post<{ checkoutUrl: string }>('/api/payments/payos/link', data);
    }
}
