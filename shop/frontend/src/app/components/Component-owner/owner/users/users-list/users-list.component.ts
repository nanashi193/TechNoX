import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {OwnerUsersService} from '../../../../../services/owner-users.service';
import {User} from '../../../../../models/user.model';
import {forkJoin} from 'rxjs';

type SortField = 'orders' | 'totalSpent';

@Component({
    selector: 'owner-users-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
    private svc = inject(OwnerUsersService);
    private router = inject(Router);

    // ===== state =====
    q = '';
    page = 1;              // 1-based
    size = 10;
    total = 0;
    loading = false;

    users: User[] = [];    // trang hiện tại
    sort: { field: SortField; dir: 'asc' | 'desc' } = {
        field: 'totalSpent',
        dir: 'desc'
    };
    selected = new Set<number>();


    // ===== derived =====
    get totalPages(): number {
        return Math.max(1, Math.ceil(this.total / this.size));
    }

    get pages(): number[] {
        const total = this.totalPages;
        if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
        const p = this.page;
        const s = new Set<number>([1, 2, total - 1, total, p - 1, p, p + 1].filter(n => n >= 1 && n <= total));
        return Array.from(s).sort((a, b) => a - b);
    }

    ngOnInit() {
        this.load();                 // gọi BE /users?q=&page=&size=&sort=
    }

    // ===== data =====
    load() {
        this.loading = true;
        const params = {
            q: this.q || '',
            page: this.page,
            size: this.size,
            sort: `${this.sort.field}_${this.sort.dir}`
        };
        this.svc.search(params).subscribe({
            next: (res) => {
                this.users = res.items ?? [];
                this.total = res.total ?? this.users.length;
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    // ===== sort =====
    sortBy(field: SortField) {
        if (this.sort.field === field) this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
        else this.sort = {field, dir: 'asc'};
        this.page = 1;
        this.load();
    }

    onSearch() {
        this.page = 1;
        this.load();
    }

    isAsc = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'asc';
    isDesc = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'desc';

    ariaSort(f: SortField) {
        return this.isAsc(f) ? 'ascending' : this.isDesc(f) ? 'descending' : 'none';
    }

    // ===== selection =====
    trackById = (_: number, u: User) => u.id;
    isSelected = (id: number) => this.selected.has(id);

    selectedCount() {
        return this.selected.size;
    }

    toggle(id: number, e: Event) {
        (e.target as HTMLInputElement).checked ? this.selected.add(id) : this.selected.delete(id);
    }

    allSelected() {
        return this.users.length > 0 && this.users.every(u => this.selected.has(u.id));
    }

    someSelected() {
        const any = this.users.some(u => this.selected.has(u.id));
        return any && !this.allSelected();
    }

    toggleAll(e: Event) {
        const on = (e.target as HTMLInputElement).checked;
        if (on) this.users.forEach(u => this.selected.add(u.id));
        else this.users.forEach(u => this.selected.delete(u.id));
    }

    toggleActive(u: User) {
        const prev = u.IsActive;
        u.IsActive = !prev;
        this.svc.toggleActive(u.id, u.IsActive).subscribe({error: () => (u.IsActive = prev)});
    }


    bulk(action: 'delete') {
        const ids = [...this.selected];
        if (ids.length === 0) return;
        if (action === 'delete' && confirm(`Xoá ${ids.length} người dùng đã chọn?`)) {
            forkJoin(ids.map(id => this.svc.delete(id))).subscribe(() => {
                this.selected.clear();
                this.load();
            });
        }
    }

    goto(n: number) {
        if (n !== this.page && n >= 1 && n <= this.totalPages) {
            this.page = n;
            this.load();
        }
    }

    prev() {
        if (this.page > 1) {
            this.page--;
            this.load();
        }
    }

    next() {
        if (this.page < this.totalPages) {
            this.page++;
            this.load();
        }
    }
}
