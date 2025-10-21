import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {OwnerUsersService} from '../../../../services/owner-users.service';
import {User} from '../../../../models/user.model';
import {forkJoin} from 'rxjs';

type SortField = 'name' | 'email' | 'phone'|'isActive' | 'ordersCount' | 'totalSpent';

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
    filtered: User[] = []; // nếu bạn có filter client thì dùng biến này như product
    selected = new Set<number>();

    sort: { field: SortField; dir: 'asc' | 'desc' } | null = null;

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

    get showPager() {
        return !this.loading && (this.totalPages > 1 || (this.page > 1 && this.users.length > 0));
    }

    ngOnInit() {
        this.load();
    }

    // ===== data =====
    load() {
        this.loading = true;
        const params: any = {q: this.q, page: this.page, size: this.size};
        if (this.sort) params.sort = `${this.sort.field},${this.sort.dir}`;
        if (this.flt.active !== null) params.isActive = this.flt.active;

        this.svc.search(params).subscribe({
            next: (res) => {
                const items = res.items ?? [];
                this.users = items;
                this.filtered = [...items];
                this.total = res.total ?? items.length;

                const tp = this.totalPages;
                if (this.page > tp) {
                    this.page = tp;
                    if (tp > 0) this.load(); else this.loading = false;
                    return;
                }

                // GIỮ selection đa trang: không clear() toàn bộ.
                // Nếu chỉ muốn giữ trong trang, bỏ comment dòng dưới:
                // this.selected.clear();

                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    onSearch() {
        this.page = 1;
        this.load();
    }

    // ===== sort =====
    sortBy(field: SortField) {
        if (!this.sort || this.sort.field !== field) {
            this.sort = {field, dir: 'asc'};
        } else if (this.sort.dir === 'asc') {
            this.sort = {field, dir: 'desc'};
        } else {
            this.sort = null;
        }
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
        return this.filtered.length > 0 && this.filtered.every(u => this.selected.has(u.id));
    }

    someSelected() {
        const any = this.filtered.some(u => this.selected.has(u.id));
        return any && !this.allSelected();
    }

    toggleAll(e: Event) {
        const on = (e.target as HTMLInputElement).checked;
        if (on) this.filtered.forEach(u => this.selected.add(u.id));
        else this.filtered.forEach(u => this.selected.delete(u.id));
    }

    // ===== actions =====
    edit(id: number) {
        this.router.navigate(['/owner/users', id]);
    }

    toggleActive(u: User) {
        const prev = u.isActive;
        u.isActive = !prev;
        this.svc.toggleActive(u.id, u.isActive).subscribe({ error: () => (u.isActive = prev) });
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
    showFilters = false;
    flt: { active: boolean | null } = { active: null };

    toggleFilters(e: Event) {
        e.stopPropagation();
        this.showFilters = !this.showFilters;
    }

    applyFilters() {
        this.page = 1;
        this.load();          // load() sẽ đọc this.flt.active
        this.showFilters = false;
    }

    clearFilters() {
        this.flt.active = null;
        this.applyFilters();
    }


    goto(n: number) {
        if (n >= 1 && n <= this.totalPages && n !== this.page) {
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
