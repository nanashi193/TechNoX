import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'; // Kiểm tra đường dẫn
import { Bill, BillCreateRequest, BillDetailRequest } from '../models/bill.model';

@Injectable({
    providedIn: 'root'
})
export class BillService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/bills`; // API endpoint cho bills

    /**
     * Tạo một hóa đơn mới (Bill)
     * @param billData Dữ liệu hóa đơn từ PaymentDetailComponent
     * @returns Observable chứa thông tin Bill đã tạo từ backend
     */
    createBill(billData: BillCreateRequest): Observable<Bill> {
        return this.http.post<Bill>(this.baseUrl, billData);
    }

    // (Thêm các hàm khác cho Bill nếu cần: getBillById, getUserBills...)
}