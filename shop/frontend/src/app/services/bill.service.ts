import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BillCreateRequest, BillResponse } from '../models/bill.model';
import { environment } from "../environments/environment";

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
}

