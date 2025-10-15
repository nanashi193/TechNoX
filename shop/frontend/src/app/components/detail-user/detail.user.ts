import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface Address {
    line1: string;
    line2?: string;
    city: string;
    district?: string;
    province: string;
    zip?: string;
}
type UserRole = 'USER' | 'STAFF' | 'ADMIN';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    roles: UserRole[];
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    address?: Address;
    createdAt: string;     // ISO
    lastLoginAt?: string;  // ISO
    stats?: { orders: number; totalSpent: number };
}

@Component({
    selector: 'app-detail-user',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DatePipe, CurrencyPipe],
    templateUrl: './detail.user.html',
    styleUrls: ['./detail.user.css']
})
export class DetailUserComponent implements OnInit {
    user!: User;
    edit = false;

    private userId = '1';
    private get LS_KEY() { return `user_detail_${this.userId}`; }

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        // lấy id từ route nếu có: /user/:id
        const idFromRoute = this.route.snapshot.paramMap.get('id');
        if (idFromRoute) this.userId = idFromRoute;

        const cached = localStorage.getItem(this.LS_KEY);
        this.user = cached ? JSON.parse(cached) : this.mockUser();
        if (!cached) this.persist();
    }

    private mockUser(): User {
        return {
            id: this.userId,
            name: 'Nguyễn Minh Quân',
            email: 'quan.nguyen@example.com',
            phone: '0901234567',
            avatarUrl: '', // có thể thay bằng URL ảnh thật
            roles: ['USER'],
            status: 'ACTIVE',
            address: {
                line1: '12 Nguyễn Huệ',
                district: 'Quận 1',
                city: 'TP.HCM',
                province: 'HCM',
                zip: '700000',
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
            lastLoginAt: new Date().toISOString(),
            stats: { orders: 5, totalSpent: 12500000 }
        };
    }

    get initials(): string {
        return this.user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';
    }

    toggleEdit() { this.edit = !this.edit; }
    save()       { this.persist(); this.edit = false; }
    cancel()     { this.load(); this.edit = false; }
    copy(text: string) { navigator.clipboard?.writeText(text); }

    private persist() { localStorage.setItem(this.LS_KEY, JSON.stringify(this.user)); }
    private load() { const c = localStorage.getItem(this.LS_KEY); if (c) this.user = JSON.parse(c); }
}
