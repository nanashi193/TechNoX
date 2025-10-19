import {Component, Input, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardService} from "../../../services/dashboard.service";
import {Kpi, TopProduct, NewProduct, OrderStat} from "../../../models/dashboard.models";
import { TopProductsComponent } from './top-products/top-products.component';
import { NewProductsComponent } from './new-products/new-products.component';
import {BaseChartDirective} from "ng2-charts";
import {RouterLink} from "@angular/router";
import { ChartConfiguration, ChartOptions } from 'chart.js';


@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, TopProductsComponent, NewProductsComponent, BaseChartDirective, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css','../../owner/owner-shared.css']
})
export class DashboardComponent implements OnInit {
    kpi!: Kpi;
    orderStats: OrderStat[] = [];
    topProducts: TopProduct[] = [];
    newProducts: NewProduct[] = [];
// mock dữ liệu biểu đồ
    lineData: ChartConfiguration<'line'>['data'] = {
        labels: ['T2','T3','T4','T5','T6','T7','CN'],
        datasets: [
            {
                data: [12, 19, 7, 11, 15, 9, 13],
                label: 'Doanh thu',
                fill: true,
                tension: 0.35,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79,70,229,0.12)',
                pointRadius: 0
            }
        ]
    };

    lineOpts: ChartOptions<'line'> = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(0,0,0,0.06)' } }
        }
    };

    constructor(private dashboardService: DashboardService) {}
    ngOnInit(): void {
        this.dashboardService.getKpi().subscribe(res => this.kpi = res);
        this.dashboardService.getOrderStats().subscribe(res => this.orderStats = res);
        this.dashboardService.getTopProducts().subscribe(res => this.topProducts = res);
        this.dashboardService.getNewProducts().subscribe(res => this.newProducts = res);
    }
}
