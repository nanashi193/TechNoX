import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

import { BillResponse } from '../models/bill.model';
export interface CartItemAPI { id: string; name: string; price: number; qty: number; }
export interface UserAPI { UserId: string; FullName: string; email?: string; }
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
    private apiPrefix = `${environment.apiBaseUrl}`;


    constructor(private http: HttpClient) { }

    getCart(): Observable<CartItemAPI[]> {
        return this.http.get<CartItemAPI[]>(`${this.apiPrefix}/cart`)
            .pipe(catchError(this.handleError));
    }

    getMe(): Observable<UserAPI> {
        return this.http.get<UserAPI>(`${this.apiPrefix}/users/me`)
            .pipe(catchError(this.handleError));
    }

    getCustomer(): Observable<CustomerAPI> {
        return this.http.get<CustomerAPI>(`${this.apiPrefix}/customer`)
            .pipe(catchError(this.handleError));
    }

    createPayOSLink(billId: string | number): Observable<PayOSLinkResponse> {
        return this.http.post<PayOSLinkResponse>(
            `${this.apiPrefix}/bills/${billId}/pay`,
            {}
        ).pipe(catchError(this.handleError));
    }

    confirmCOD(billId: string | number): Observable<BillResponse> {
        const url = `${this.apiPrefix}/bills/${billId}/confirm-cod`;
        return this.http.post<BillResponse>(url, {})
            .pipe(
                catchError(this.handleError)
            );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Đã có lỗi không xác định!';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Lỗi client: ${error.error.message}`;
        } else {
            const serverMsg = typeof error.error === 'string' && error.error.length > 0
                ? error.error
                : error.message;
            errorMessage = `Server trả về lỗi (Code: ${error.status} - ${error.statusText}): ${serverMsg}`;
        }
        console.error(`[PaymentService] ${errorMessage} - URL: ${error.url}`);
        return throwError(() => new Error(errorMessage));
    }
    getBillPayStatus(billId: string | number): Observable<{ status: string }> {
        const url = `${this.apiPrefix}/bills/${billId}/pay/status`;

        return this.http.get<{ status: string }>(url)
            .pipe(
                catchError(this.handleError)
            );
    }
}

