import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BaseChartDirective} from 'ng2-charts';
import {ChartConfiguration, ChartOptions} from 'chart.js';
import {RouterLink} from "@angular/router";
import {TopProduct} from "../../../models/top-product.model";
import {TopProductsComponent} from "./top-products/top-products.component";

@Component({
    selector: 'owner-dashboard',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, RouterLink, TopProductsComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    kpi = {
        revenueToday: 0,
        ordersToday: 0,
        newCustomersToday: 0,
    };

    lineData: ChartConfiguration<'line'>['data'] = {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        datasets: [{
            label: 'Doanh thu (triệu ₫)',
            data: [12, 19, 3, 5, 2, 3, 7],
            fill: true,
            tension: 0.4,
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.12)',
            pointRadius: 3
        }]
    };
    lineOpts: ChartOptions<'line'> = {responsive: true, maintainAspectRatio: false};

    orderStats = [
        {label: 'Chưa thanh toán', value: 0},
        {label: 'Chưa giao hàng', value: 14},
        {label: 'Đang giao', value: 2},
        {label: 'Đã hủy', value: 0},
    ];

    topProducts: TopProduct[] = [
        {
            image: '/assets/demo/p1.jpg',
            name: 'Photive wireless speakers',
            changePct: -72,
            price: 65,
            sold: 7545,
            sales: 15302
        },
        {
            image: '/assets/demo/p2.jpg',
            name: 'Topman shoe in green',
            changePct: 69,
            price: 21,
            sold: 6643,
            sales: 12492
        },
        {
            image: '/assets/demo/p3.jpg',
            name: 'RayBan black sunglasses',
            changePct: -65,
            price: 37,
            sold: 5951,
            sales: 10351
        },
        {image: '/assets/demo/p4.jpg', name: "Mango Women's shoe", changePct: -53, price: 65, sold: 5002, sales: 9917},
    ];

    ngOnInit(): void {
        // TODO: gọi API thật. Hiện dùng mock:
        this.kpi = {revenueToday: 0, ordersToday: 0, newCustomersToday: 0};
    }
}
