import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardService} from "../../../services/dashboard.service";
import {Kpi, TopProduct, NewProduct, OrderStat, RevenueQuery, RevenuePoint} from "../../../models/dashboard.models";
import { TopProductsComponent } from './top-products/top-products.component';
import { NewProductsComponent } from './new-products/new-products.component';
import {BaseChartDirective} from "ng2-charts";
import {RouterLink} from "@angular/router";
import {Chart, ChartConfiguration, ChartOptions} from 'chart.js';
import {DateRange, OwnerDateRangeComponent} from "./owner-date-range/owner-date-range.component";


@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, TopProductsComponent, NewProductsComponent, BaseChartDirective, RouterLink, OwnerDateRangeComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css','../../owner/owner-shared.css']
})
export class DashboardComponent implements OnInit {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    kpi: Kpi = { revenueToday: 0, ordersToday: 0, newCustomersToday: 0 };
    orderStats: OrderStat[] = [];
    topProducts: TopProduct[] = [];
    newProducts: NewProduct[] = [];

    // mặc định là hôm nay; có thể đổi sang 7 ngày gần nhất nếu muốn
    range: DateRange = { start: new Date(), end: new Date() };

    // dữ liệu cho ng2-charts
    lineData: ChartConfiguration<'line'>['data'] = {
        labels: [],
        datasets: [{
            data: [],
            label: 'Doanh thu',
            fill: true,
            tension: 0.35,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79,70,229,0.12)',
            pointRadius: 0
        }]
    };

    lineOpts: ChartOptions<'line'> = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(0,0,0,0.06)' } }
        }
    };

    constructor(private ds: DashboardService) {}

    ngOnInit(): void {
        this.reload(); // load lần đầu theo range mặc định
    }

    onRangeChanged(r: DateRange){
        this.range = r;
        this.reload();
    }

    /** ---- LOAD DỮ LIỆU TỪ BE ---- */
    private reload(){
        const q: RevenueQuery = {
            from: this.dateOnlyLocal(this.range.start),
            to:   this.dateOnlyLocal(this.range.end),
            bucket: 'day'
        };

        this.ds.getRevenue(q).subscribe(res => this.renderRevenue(res.points));
        this.ds.getKpi(q).subscribe(res => this.kpi = res);
        this.ds.getOrderStats(q).subscribe(res => this.orderStats = res);
        this.ds.getTopProducts(q).subscribe(res => this.topProducts = res);
        this.ds.getNewProducts().subscribe(res => this.newProducts = res);
    }

    /** Map dữ liệu về chart và update */
    private renderRevenue(points: RevenuePoint[]){
        this.lineData.labels = points.map(p =>
            new Date(p.date).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })
        );
        this.lineData.datasets[0].data = points.map(p => p.revenue);
        this.chart?.update();
    }

    /** Tránh lệch timezone khi gửi lên BE */
    private dateOnlyLocal(d: Date){
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const day = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${day}`;
    }
}
