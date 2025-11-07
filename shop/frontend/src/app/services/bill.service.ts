import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BillCreateRequest, BillResponse } from '../models/bill.model';
import { environment } from "../environments/environment";
import { BillAdminResponse } from '../models/bill-admin.model';

@Injectable({
    providedIn: 'root'
})
export class BillService {
    private http = inject(HttpClient);

    private baseUrl = `${environment.apiBaseUrl}/bills`;
    createBill(payload: BillCreateRequest): Observable<BillResponse> {
        return this.http.post<BillResponse>(
            this.baseUrl,
            payload
        );
    }

    getMyAssignedOrders(): Observable<BillAdminResponse[]> {
        return this.http.get<BillAdminResponse[]>(`${this.baseUrl}/staff/my-orders`);
    }

    /** 2. [STAFF] Đánh dấu đơn hàng đã giao (Delivering -> Succeed) */
    completeOrder(billId: number): Observable<BillAdminResponse> {
        return this.http.put<BillAdminResponse>(
            `${this.baseUrl}/staff/complete/${billId}`,
            {}
        );
    }
}

