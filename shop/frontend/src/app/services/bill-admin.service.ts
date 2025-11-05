import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BillAdminResponse } from '../models/bill-admin.model';
import { StaffInfo } from '../models/staff-info.model';
import { AssignStaffRequest } from '../models/assign-staff-request.model';

@Injectable({
    providedIn: 'root'
})
export class BillAdminService {
    private apiUrl1 = 'http://localhost:8080/api/v1/bills';
    private apiUrl2 = 'http://localhost:8080/api/v1/users';

    constructor(private http: HttpClient) { }

    getBillsForAdmin(): Observable<BillAdminResponse[]> {
        return this.http.get<BillAdminResponse[]>(`${this.apiUrl1}/admin`);
    }

    getStaffList(): Observable<StaffInfo[]> {
        return this.http.get<StaffInfo[]>(`${this.apiUrl2}/staff`);
    }

    getById(id: number) {
        return this.http.get<BillAdminResponse>(`${this.apiUrl1}/${id}`);
    }


    assignStaff(billId: number, staffId: number): Observable<BillAdminResponse> {

        const requestBody: AssignStaffRequest = {
            staffId: staffId
        };
        return this.http.put<BillAdminResponse>(
            `${this.apiUrl1}/${billId}/assign-staff`,
            requestBody
        );
    }
}