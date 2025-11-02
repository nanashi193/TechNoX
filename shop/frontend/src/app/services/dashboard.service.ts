import {inject, Injectable} from '@angular/core';
import { Observable, of } from 'rxjs';
import {Kpi, TopProduct, NewProduct, OrderStat, RevenueQuery, RevenueSeries} from "../models/dashboard.models";
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../environments/environment";

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private base = environment.apiBaseUrl;

    getRevenue(q: RevenueQuery): Observable<RevenueSeries> {
        return this.http.get<RevenueSeries>(`${this.base}/dashboard/revenue`, {
            params: this.params({ from: q.from, to: q.to, bucket: q.bucket ?? 'day' })
        });
    }

    getKpi(q: RevenueQuery): Observable<Kpi> {
        return this.http.get<Kpi>(`${this.base}/dashboard/kpi`, {
            params: this.params({ from: q.from, to: q.to })
        });
    }

    getOrderStats(q: RevenueQuery): Observable<OrderStat[]> {
        return this.http.get<OrderStat[]>(`${this.base}/dashboard/order-stats`, {
            params: this.params({ from: q.from, to: q.to })
        });
    }

    getTopProducts(q: RevenueQuery, limit = 4): Observable<TopProduct[]> {
        return this.http.get<TopProduct[]>(`${this.base}/dashboard/top-products`, {
            params: this.params({ from: q.from, to: q.to, limit })
        })
        // Nếu BE trả {items: [...]}, bỏ comment dòng dưới:
        // .pipe(map((r: any) => r.items as TopProduct[]));
    }

    getNewProducts(limit = 6): Observable<NewProduct[]> {
        return this.http.get<NewProduct[]>(`${this.base}/products/new`, {
            params: this.params({ limit })
        })
        // .pipe(map((r:any)=> r.items as NewProduct[]));
    }
    private params(obj: Record<string, any>) {
        let p = new HttpParams();
        Object.entries(obj).forEach(([k, v]) => {
            if (v !== undefined && v !== null) p = p.set(k, String(v));
        });
        return p;
    }
}
