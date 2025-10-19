import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {OwnerUsersService} from "../../../../services/owner-users.service";
import {User} from '../../../../models/user.model';

type SortField = 'name' | 'email' | 'phone' | 'isActive' | 'ordersCount' | 'totalSpent';
type SortDir = 'asc' | 'desc';

@Component({
    standalone: true,
    selector: 'owner-users-list',
    imports: [CommonModule, FormsModule],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css', '../../owner-shared.css']
})
export class UsersListComponent implements OnInit {
    private svc = inject(OwnerUsersService);

    q = '';
    page = 1;
    size = 20;
    total = 0;
    users: User[] = [];

    sort: { field: SortField; dir: SortDir } | null = null;

    ngOnInit() {
        this.load();
    }

    load() {
        const params: any = {q: this.q, page: this.page, size: this.size};
        if (this.sort) params.sort = `${this.sort.field},${this.sort.dir}`;
        this.svc.search(params).subscribe(res => {
            this.users = res.items;
            this.total = res.total;
        });
    }

    trackById(_index: number, u: User) {
        return u.id;
    }

    onSearch() {
        this.page = 1;
        this.load();
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.total / this.size));
    }

    get pages(): number[] {
        const total = this.totalPages;
        if (total <= 7) return Array.from({length: total}, (_,i)=>i+1);
        const p = this.page;
        const s = new Set<number>([1,2,total-1,total,p-1,p,p+1].filter(n => n>=1 && n<=total));
        return Array.from(s).sort((a,b)=>a-b);
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

    sortBy(field: SortField) {
        if (!this.sort || this.sort.field !== field) this.sort = {field, dir: 'asc'};
        else if (this.sort.dir === 'asc') this.sort = {field, dir: 'desc'};
        else this.sort = null;
        this.page = 1;
        this.load();
    }

    isAsc = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'asc';
    isDesc = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'desc';

    ariaSort(f: SortField) {
        return this.isAsc(f) ? 'ascending' : this.isDesc(f) ? 'descending' : 'none';
    }

    toggleActive(u: User) {
        const prev = u.isActive;
        u.isActive = !prev;
        this.svc.toggleActive(u.id, u.isActive).subscribe({error: () => u.isActive = prev});
    }
}
