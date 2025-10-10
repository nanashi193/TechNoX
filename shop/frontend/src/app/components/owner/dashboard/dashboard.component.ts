import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import {RouterLink} from "@angular/router";

@Component({
    selector: 'owner-dashboard',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    // KPI nhanh
    kpi = {
        revenueToday: 0,
        ordersToday: 0,
        newCustomersToday: 0,
    };

    // Biểu đồ doanh thu (line)
    lineData: ChartConfiguration<'line'>['data'] = {
        labels: ['T2','T3','T4','T5','T6','T7','CN'],
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
    lineOpts: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };

    // Trạng thái đơn hàng (mock)
    orderStats = [
        { label: 'Chưa thanh toán', value: 0 },
        { label: 'Chưa giao hàng', value: 14 },
        { label: 'Đang giao', value: 2 },
        { label: 'Đã hủy', value: 0 },
    ];

    // Hoạt động gần đây (mock)
    activities = [
        '25/09: Thêm sản phẩm “Smart TV LG 43 inch 4K”',
        '24/09: Đơn #A1245 đã giao thành công',
        '24/09: Khách mới đăng ký: Nam Nguyễn',
    ];

    ngOnInit(): void {
        // TODO: gọi API thật. Hiện dùng mock:
        this.kpi = { revenueToday: 0, ordersToday: 0, newCustomersToday: 0 };
    }
}
