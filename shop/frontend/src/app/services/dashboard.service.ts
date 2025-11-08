import {inject, Injectable} from '@angular/core';
import {forkJoin, Observable, of, tap} from 'rxjs';
import {
    Kpi,
    TopProduct,
    NewProduct,
    OrderStat,
    RevenueQuery,
    RevenueSeries,
    RevenuePoint
} from "../models/dashboard.models";
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../environments/environment";
import {map} from "rxjs/operators";

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private base = environment.apiBaseUrl;
    private DASH = `${this.base}/dashboard`;

    /** Biểu đồ doanh thu: ghép từ /revenue/by-date cho từng ngày trong khoảng */
    getRevenue(q: RevenueQuery): Observable<RevenueSeries> {
        const days = this.enumerateDays(q.from, q.to);          // ['2025-11-01', '2025-11-02', ...]
        const calls = days.map(d =>
            this.http.get<{ date: string; revenue: number }>(`${this.DASH}/revenue/by-date`, {
                params: new HttpParams().set('date', d)
            })
        );

        return forkJoin(calls).pipe(map(rows => {
            const points: RevenuePoint[] =
                rows.map(r => ({date: r.date, revenue: r.revenue ?? 0, orders: 0}));
            const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);
            return {
                bucket: q.bucket ?? 'day',
                currency: 'VND',
                points,
                totals: {revenue: totalRevenue, orders: 0, aov: 0}
            } as RevenueSeries;
        }));
    }

    getKpi(q: RevenueQuery): Observable<Kpi> {
        const date = q.to || q.from;
        const p = (path: string) =>
            this.http.get<any>(`${this.DASH}${path}`, {params: new HttpParams().set('date', date)});

        return forkJoin({
            rev: p('/revenue/by-date'),          // -> { date, revenue }
            ord: p('/orders/by-date'),           // -> { date, totalOrders }
            cus: p('/customers/new/by-date')     // -> { date, newCustomers }
        }).pipe(map(({rev, ord, cus}) => ({
            revenueToday: rev?.revenue ?? 0,
            ordersToday: ord?.totalOrders ?? 0,
            newCustomersToday: cus?.newCustomers ?? 0
        })));
    }

    /** Trạng thái đơn hàng (BE hiện tại không có from/to) */
    getOrderStats(_: RevenueQuery): Observable<OrderStat[]> {
        return this.http.get<{ statusStats: any[] }>(`${this.DASH}/orders/status`).pipe(
            map(res => {
                const statsArray = res?.statusStats ?? [];

                const statsMap: { [key: string]: number } = {};
                statsArray.forEach((stat: any) => {
                    const status = stat.status?.toUpperCase();
                    statsMap[status] = stat.total ?? 0;
                });

                return [
                    {label: 'Đã xác nhận', value: statsMap['CONFIRMED'] ?? 0, status: "Confirmed"},
                    {label: 'Đang giao', value: statsMap['DELIVERING'] ?? 0, status: "Delivering"},
                    {label: 'Đã giao', value: statsMap['DELIVERED'] ?? 0, status: "Delivered"},
                    {label: 'Đã hoàn thành', value: statsMap['SUCCEED'] ?? 0, status: "Succeed"},
                    {label: 'Đã hủy', value: statsMap['CANCELLED'] ?? 0, status: "Cancelled"},
                ] as OrderStat[];
            })
        );
    }

    getOrdersSeries(q: RevenueQuery) {
        const days = this.enumerateDays(q.from, q.to);
        const calls = days.map(d =>
            this.http.get<{ date: string; totalOrders: number }>(
                `${this.DASH}/orders/by-date`,
                { params: new HttpParams().set('date', d) }
            )
        );
        return forkJoin(calls).pipe(
            map(rows => ({
                points: rows.map(r => ({ date: r.date, orders: r.totalOrders ?? 0 }))
            }))
        );
    }


    /** Top sản phẩm: theo 7 ngày gần nhất (không phụ thuộc range) */
    getTopProducts(_: RevenueQuery, limit = 4): Observable<TopProduct[]> {
        const toNum = (v: any) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };

        const THUMB_PATH = '/images/'; // <-- đổi nếu BE khác
        const toUrl = (t?: string) => {
            if (!t) return '';
            return /^https?:\/\//i.test(t) ? t : `${this.base}${THUMB_PATH}${t}`;
        };

        return this.http
            .get<{ topProducts: any[] }>(`${this.DASH}/top-products/last7days`, {
                params: new HttpParams().set('limit', String(limit))
            })
            .pipe(
                map(r => (r?.topProducts ?? []).map(x => ({
                    image:     toUrl(x.thumbnail),
                    name:      x.productName ?? '',
                    price:     toNum(x.displayPrice ?? x.price ?? 0),      // đơn giá
                    sold:      toNum(x.totalSold ?? x.sold ?? 0),         // đã bán
                    sales:     toNum(x.totalRevenue ?? x.sales ?? 0),      // doanh thu
                    changePct: toNum(x.changePct)
                }) as TopProduct))
            );
    }

    getNewProducts(limit = 6): Observable<NewProduct[]> {
        return this.http.get<any[]>(`${this.base}/products/newest-month`, {
            params: this.params({ limit })
        }).pipe(
            map(arr => (arr ?? []).map(p => ({
                id: p.id,
                // 1) lấy ảnh: ưu tiên thumbnail, fallback ảnh đầu trong imageItems
                image: p.thumbnail || p.image || (p.imageItems?.[0]?.url ?? ''),
                name : p.name ?? '',
                // 2) ngày: KHÔNG parse Date trực tiếp (createdAt có .87833)
                //    chỉ lấy phần YYYY-MM-DD để date pipe định dạng
                date : this.datePart(p.createdAt ?? p.createAt ?? p.created ?? '')
            } as NewProduct)))
        );
    }


    /* ===== helpers ===== */
    private params(obj: Record<string, any>) {
        let p = new HttpParams();
        Object.entries(obj).forEach(([k, v]) => {
            if (v !== undefined && v !== null) p = p.set(k, String(v));
        });
        return p;
    }
    private enumerateDays(from: string, to: string): string[] {
        const out: string[] = [];
        let d = new Date(from + 'T00:00:00');
        const end = new Date(to + 'T00:00:00');
        while (d.getTime() <= end.getTime()) {
            out.push(this.localISO(d));
            d.setDate(d.getDate() + 1);
        }
        return out;
    }

    private localISO(d: Date) {
        const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'),
            day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    private datePart(v: unknown): string {
        if (v instanceof Date) {
            const y=v.getFullYear(), m=String(v.getMonth()+1).padStart(2,'0'), d=String(v.getDate()).padStart(2,'0');
            return `${y}-${m}-${d}`;
        }
        if (typeof v === 'string' && v.length >= 10) return v.slice(0, 10); // '2025-11-01'
        return '';
    }

}

