import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardService} from "../../../../services/dashboard.service";
import {Kpi, TopProduct, NewProduct, OrderStat, RevenueQuery, RevenuePoint} from "../../../../models/dashboard.models";
import {TopProductsComponent} from './top-products/top-products.component';
import {NewProductsComponent} from './new-products/new-products.component';
import {BaseChartDirective} from "ng2-charts";
import {RouterLink} from "@angular/router";
import {Chart, ChartConfiguration, ChartOptions} from 'chart.js';
import {DateRange, OwnerDateRangeComponent} from "./owner-date-range/owner-date-range.component";
import {catchError, forkJoin, of} from "rxjs";
import 'chart.js/auto';

type RevPoint = { date: string; revenue: number };
type OrdPoint = { date: string; orders: number };
type RowPoint = { date: string; revenue: number; orders: number };
type RangeTotals = { revenue: number; orders: number };

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, TopProductsComponent, NewProductsComponent, BaseChartDirective, RouterLink, OwnerDateRangeComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css', '../../owner/owner-shared.css']
})
export class DashboardComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    kpi: Kpi = {revenueToday: 0, ordersToday: 0, newCustomersToday: 0};
    orderStats: OrderStat[] = [];
    topProducts: TopProduct[] = [];
    newProducts: NewProduct[] = [];

    // mặc định là hôm nay; có thể đổi sang 7 ngày gần nhất nếu muốn
    range: DateRange = {start: new Date(), end: new Date()};

    /** DATA cho cột */
    barData: ChartConfiguration<'bar'>['data'] = {
        labels: [],
        datasets: [
            {
                label: 'Doanh thu',
                yAxisID: 'yRevenue',
                data: [],
                backgroundColor: 'rgba(148, 163, 184, 0.45)', // xám nhạt (giống mẫu)
                hoverBackgroundColor: 'rgba(148, 163, 184, 0.75)',
                borderRadius: 6,
                barPercentage: 0.9,
                categoryPercentage: 0.6
            },
            {
                label: 'Đơn hàng',
                yAxisID: 'yOrders',
                data: [],
                backgroundColor: '#4f46e5',                  // xanh dương (giống mẫu)
                hoverBackgroundColor: '#4338ca',
                borderRadius: 6,
                barPercentage: 0.9,
                categoryPercentage: 0.6
            }
        ]
    };
    /** OPTIONS cho cột */
    barOpts: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {position: 'bottom', labels: {usePointStyle: true, pointStyle: 'circle'}},
            tooltip: {
                callbacks: {
                    title: (items) => items?.[0]?.label ? `Ngày ${items[0].label}` : '',
                    label: (ctx) => {
                        const v = Number(ctx.raw ?? 0);
                        const axis = (ctx.dataset as any).yAxisID;
                        if (axis === 'yRevenue') {
                            return `Doanh thu: ${v.toLocaleString('vi-VN')} ₫`;
                        }
                        return `Đơn hàng: ${v.toLocaleString('vi-VN')}`;
                    }
                }
            }
        },
        scales: {
            x: {grid: {display: false}, ticks: {maxRotation: 0}},

            yRevenue: {
                type: 'linear',
                position: 'left',
                grid: {color: 'rgba(0,0,0,.06)'},
                border: {display: false},
                ticks: {callback: v => Number(v).toLocaleString('vi-VN') + ' ₫'}
            },

            yOrders: {
                type: 'linear',
                position: 'right',
                grid: {drawOnChartArea: false},
                ticks: {precision: 0} // số nguyên
            }
        }
    };

    constructor(private ds: DashboardService) {
    }

    ngOnInit(): void {
        this.loadKpiToday();
        this.reload(); // load lần đầu theo range mặc định

        this.ds.getNewProducts(5)
            .pipe(catchError(() => of([] as NewProduct[])))
            .subscribe(res => this.newProducts = res);
    }
    onRangeChanged(r: DateRange) {
        this.range = r;
        this.reload();
    }

    totalsNow: RangeTotals = {revenue: 0, orders: 0};
    totalsPrev: RangeTotals = {revenue: 0, orders: 0};
    deltaRev: number | null = null;
    deltaOrd: number | null = null;

    private calcDelta(cur: number | undefined, prev: number | undefined): number | null {
        const c = Number(cur ?? 0);
        const p = Number(prev ?? 0);
        if (!Number.isFinite(c) || !Number.isFinite(p)) return null;

        // các case đặc biệt
        if (p === 0 && c === 0) return 0;       // không đổi
        if (p === 0 && c > 0)  return 100;      // tăng từ 0 -> có
        if (c === 0 && p > 0)  return -100;     // rơi về 0

        return ((c - p) / p) * 100;
    }



    private prevOf(r: DateRange): DateRange {
        const start = new Date(r.start);
        const end = new Date(r.end);
        // tính độ dài inclusive
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
        const pStart = new Date(start);
        pStart.setDate(pStart.getDate() - days);
        const pEnd = new Date(end);
        pEnd.setDate(pEnd.getDate() - days);
        return {start: pStart, end: pEnd};
    }

    private sumRevenue(rows: RowPoint[]) {
        return rows.reduce((s, p) => s + (p.revenue || 0), 0);
    }

    private sumOrders(rows: RowPoint[]) {
        return rows.reduce((s, p) => s + (p.orders || 0), 0);
    }
    private loadKpiToday() {
        const today = this.dateOnlyLocal(new Date());
        const q: RevenueQuery = { from: today, to: today, bucket: 'day' };

        this.ds.getKpi(q)
            .pipe(catchError(() => of(this.kpi)))
            .subscribe(res => this.kpi = res);
    }

    private loadToken = 0;

    /** ---- LOAD DỮ LIỆU TỪ BE ---- */
    private reload() {
        const token = ++this.loadToken;

        const qNow: RevenueQuery = {
            from: this.dateOnlyLocal(this.range.start),
            to: this.dateOnlyLocal(this.range.end),
            bucket: 'day'
        };

        const prev = this.prevOf(this.range);
        const qPrev: RevenueQuery = {
            from: this.dateOnlyLocal(prev.start),
            to: this.dateOnlyLocal(prev.end),
            bucket: 'day'
        };


        forkJoin({
            revNow: this.ds.getRevenue(qNow),
            ordNow: this.ds.getOrdersSeries(qNow),
            revPrev: this.ds.getRevenue(qPrev),
            ordPrev: this.ds.getOrdersSeries(qPrev),
        }).subscribe(({revNow, ordNow, revPrev, ordPrev}) => {
            if (token !== this.loadToken) return;

            const rowsNow: RowPoint[] = this.mergeByDate(
                revNow.points.map(p => ({date: p.date, revenue: p.revenue})),        // RevPoint
                (ordNow.points ?? []).map(p => ({date: p.date, orders: p.orders}))    // OrdPoint
            );

            this.renderBars(rowsNow);

            // totals cho cards
            this.totalsNow = {
                revenue: revNow.totals?.revenue ?? this.sumRevenue(rowsNow),
                orders: (ordNow.points ?? []).reduce((s, p) => s + (p.orders || 0), 0)
            };

            // 2) Merge PREV
            const rowsPrev: RowPoint[] = this.mergeByDate(
                revPrev.points.map(p => ({date: p.date, revenue: p.revenue})),
                (ordPrev.points ?? []).map(p => ({date: p.date, orders: p.orders}))
            );

            this.totalsPrev = {
                revenue: revPrev.totals?.revenue ?? this.sumRevenue(rowsPrev),
                orders: (ordPrev.points ?? []).reduce((s, p) => s + (p.orders || 0), 0)
            };

            this.deltaRev = this.calcDelta(this.totalsNow.revenue, this.totalsPrev.revenue);
            this.deltaOrd = this.calcDelta(this.totalsNow.orders,  this.totalsPrev.orders);

        });

        this.ds.getOrderStats(qNow)
            .pipe(catchError(() => of([] as OrderStat[])))
            .subscribe(res => this.orderStats = res);

        this.ds.getTopProducts(qNow, 4)
            .pipe(catchError(() => of([] as TopProduct[])))
            .subscribe(res => this.topProducts = res);
    }


    /** Map dữ liệu về chart và update */
    private mergeByDate(rev: RevPoint[], ord: OrdPoint[]): RowPoint[] {
        const m = new Map<string, RowPoint>();
        for (const r of rev) m.set(r.date, {date: r.date, revenue: r.revenue || 0, orders: 0});
        for (const o of ord) {
            const row = m.get(o.date) ?? {date: o.date, revenue: 0, orders: 0};
            row.orders = o.orders || 0;
            m.set(o.date, row);
        }
        return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    private renderBars(rows: RowPoint[]) {
        this.barData.labels = rows.map(p =>
                new Date(p.date).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})
            // Nếu bucket='hour': dùng { hour: 'numeric' } để hiện 1AM, 2AM...
        );
        this.barData.datasets[0].data = rows.map(p => p.revenue);
        this.barData.datasets[1].data = rows.map(p => p.orders);
        this.chart?.update();
    }

    /** Tránh lệch timezone khi gửi lên BE */
    private dateOnlyLocal(d: Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
}
