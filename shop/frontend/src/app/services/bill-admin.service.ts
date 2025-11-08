import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { BillAdminResponse } from '../models/bill-admin.model';
import { StaffInfo } from '../models/staff-info.model';
import { AssignStaffRequest } from '../models/assign-staff-request.model';

@Injectable({ providedIn: 'root' })
export class BillAdminService {
    private apiUrl1 = `${environment.apiBaseUrl}/bills`;
    private apiUrl2 = `${environment.apiBaseUrl}/users`;

    constructor(private http: HttpClient) {}

    getBillsForAdmin(): Observable<BillAdminResponse[]> {
        return this.http.get<BillAdminResponse[]>(`${this.apiUrl1}/admin`);
    }

    getStaffList(): Observable<StaffInfo[]> {
        return this.http.get<StaffInfo[]>(`${this.apiUrl2}/staff`);
    }

    getById(id: number) {
        return this.http.get<BillAdminResponse>(`${this.apiUrl1}/${id}`);
    }

    assignStaff(billId: number, staffId: number) {
        const body: AssignStaffRequest = { staffId };
        return this.http.put<BillAdminResponse>(`${this.apiUrl1}/${billId}/assign-staff`, body);
    }

    /** NEW: Lấy bill theo user (support array hoặc paginated) */
    getBillsByUser(
        userId: number,
        opts: { page?: number; limit?: number; sort?: string } = {}
    ): Observable<{ items: BillAdminResponse[]; totalItems: number }> {
        const { page = 1, limit = 10, sort = 'created_desc' } = opts;
        let params = new HttpParams()
            .set('page', String(page))
            .set('limit', String(limit))
            .set('sort', sort);

        return this.http
            .get<any>(`${this.apiUrl2}/${userId}/bills`, { params })
            .pipe(
                map(res => {
                    // chấp nhận cả 2 dạng payload:
                    // 1) { items: BillAdminResponse[], totalItems: number }
                    // 2) BillAdminResponse[]
                    const items: BillAdminResponse[] = Array.isArray(res) ? res : (res.items ?? []);
                    const totalItems: number = Array.isArray(res) ? items.length : (res.totalItems ?? items.length);
                    return { items, totalItems };
                })
            );
    }

    /** Nếu BE không có /users/{id}/bills mà dùng /bills/admin?userId=... thì dùng hàm này thay thế:
     getBillsByUserViaAdmin(userId: number, opts: {page?: number; limit?: number; sort?: string} = {}) {
     const { page = 1, limit = 10, sort = 'created_desc' } = opts;
     let params = new HttpParams()
     .set('userId', String(userId))
     .set('page', String(page))
     .set('limit', String(limit))
     .set('sort', sort);
     return this.http.get<any>(`${this.apiUrl1}/admin`, { params }).pipe(map(...));
     }
     */
}
