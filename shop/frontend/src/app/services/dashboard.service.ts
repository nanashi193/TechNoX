import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {Kpi, TopProduct, NewProduct, OrderStat } from "../models/dashboard.models";

@Injectable({ providedIn: 'root' })
export class DashboardService {
// TODO : thay of(...) bằng this.http.get('/api/dashboard/kpi')
    getKpi(): Observable<Kpi> {
        return of({
            revenueToday: 0,
            ordersToday: 0,
            newCustomersToday: 0
        });
    }

    getOrderStats(): Observable<OrderStat[]> {
        return of([
            { label: 'Chưa thanh toán', value: 0 },
            { label: 'Chưa giao hàng', value: 14 },
            { label: 'Đang giao', value: 2 },
            { label: 'Đã hủy', value: 0 }
        ]);
    }

    getTopProducts(): Observable<TopProduct[]> {
        return of([
            { image: '/assets/demo/p1.jpg', name: 'Photive wireless speakers', changePct: -72, price: 65, sold: 7545, sales: 15302 },
            { image: '/assets/demo/p2.jpg', name: 'Topman shoe in green', changePct: 69, price: 21, sold: 6643, sales: 12492 },
            { image: '/assets/demo/p3.jpg', name: 'RayBan black sunglasses', changePct: -65, price: 37, sold: 5951, sales: 10351 },
            { image: '/assets/demo/p4.jpg', name: "Mango Women's shoe", changePct: -53, price: 65, sold: 5002, sales: 9917 },
        ]);
    }

    getNewProducts(): Observable<NewProduct[]> {
        return of([
            { image: '/assets/demo/new1.jpg', name: 'AirPods Max – Silver', date: '10/10/2025' },
            { image: '/assets/demo/new2.jpg', name: 'MacBook Pro M4 – Space Black', date: '08/10/2025' },
            { image: '/assets/demo/new3.jpg', name: 'iPhone 16 Pro – Natural Titanium', date: '06/10/2025' },
        ]);
    }
}
