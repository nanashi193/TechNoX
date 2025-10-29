import {Component, HostListener, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Product} from "../../../../models/products.model";
import {ProductService} from "../../../../services/products.service";
import {Router, RouterLink} from "@angular/router";

type ProductRow = {
    id:number; name:string; image:string; type:string;
    sku:string; price:number; variants:number; inStock:boolean;
};
type SortField = 'name'|'type'|'sku'|'price'|'variants'|'stockQty';

@Component({
    selector: 'app-products-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './products-list.component.html',
    styleUrls: ['./products-list.component.css']
})

export class ProductsListComponent implements OnInit {
    private svc = inject(ProductService);
    private router = inject(Router);

    // ====== state ======
    q = '';
    page = 1;                 // UI: 1-based
    size = 8;
    total = 0;
    loading = false;

    // Nếu BE dùng page 0-based => bật cờ này
    private apiPageZeroBased = false;

    products: Product[] = [];
    filtered: Product[] = [];
    selected = new Set<number>();
    visibleCols = 6;
// ====== derived ======
    get totalPages(): number {
        return Math.max(1, Math.ceil(this.total / this.size));
    }
    get pages(): number[] {
        const total = this.totalPages;
        if (total <= 7) return Array.from({length: total}, (_,i)=>i+1);
        const p = this.page;
        const s = new Set<number>([1,2,total-1,total,p-1,p,p+1].filter(n => n>=1 && n<=total));
        return Array.from(s).sort((a,b)=>a-b);
    }
    get showPager() {
        return !this.loading && (this.totalPages > 1 || (this.page > 1 && this.products.length > 0));
    }
    sort: { field: SortField ; dir: 'asc'|'desc' } | null = null;

    ngOnInit(){ this.load(); }

    load(){
        this.loading = true;

        const params: any = {
            q: this.q || undefined,   // nếu bạn vẫn muốn giữ ô search
            page: this.page,
            size: this.size
        };

        // tồn kho
        if (this.flt.stock !== 'all') params.inStock = (this.flt.stock === 'in');
        // SKU
        const sku = this.flt.sku.trim();
        if (sku) params.sku = sku;
        // type (nếu BE dùng categoryId, đổi key & kiểu)
        if (this.flt.type) params.type = this.flt.type;

        if (this.sort) params.sort = `${this.sort.field},${this.sort.dir}`;

        this.svc.search(params).subscribe({
            next: (res: any) => {
                const items: Product[] = (res.items ?? res.content ?? res) as Product[];
                this.products = items;
                this.filtered = [...items];

                // gom các type có trong trang hiện tại để show select (tuỳ chọn)
                const moreTypes = Array.from(new Set(items.map(p => p.type).filter(Boolean) as string[]));
                this.types = Array.from(new Set([...(this.types ?? []), ...moreTypes]));

                this.total = res.total ?? res.totalCount ?? res.totalElements ?? items.length;
                const tp = this.totalPages;
                if (this.page > tp) { this.page = tp; if (tp > 0) this.load(); else this.loading = false; return; }

                this.selected.clear();
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    sortBy(field: SortField){
        if (!this.sort || this.sort.field !== field) {
            this.sort = { field, dir: 'asc' };
        } else if (this.sort.dir === 'asc') {
            this.sort = { field, dir: 'desc' };
        } else {
            this.sort = null;
        }
        this.page = 1;
        this.load();
    }
    isAsc  = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'asc';
    isDesc = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'desc';
    ariaSort(f: SortField){ return this.isAsc(f)?'ascending':this.isDesc(f)?'descending':'none'; }


    onSearch(){ this.page = 1; this.load(); }

    // Selection
    trackById = (_:number, p:Product)=>p.id;
    isSelected = (id:number) => this.selected.has(id);
  get  selectedCount(){ return this.selected.size; }

    toggle(id: number, e: Event) {
        (e.target as HTMLInputElement).checked ? this.selected.add(id) : this.selected.delete(id);
    }
    allSelected() {
        return this.filtered.length > 0 && this.filtered.every(p => this.selected.has(p.id));
    }
    toggleAll(e: Event) {
        const on = (e.target as HTMLInputElement).checked;
        if (on) {
            this.selected = new Set(this.filtered.map(p => p.id));   // replace selection
        } else {
            this.filtered.forEach(p => this.selected.delete(p.id));
        }
    }

    // CRUD
    edit(id:number){ this.router.navigate(['/owner/products', id, 'edit']); }
    create(){ this.router.navigate(['/owner/products', 'new']); }

    // Bulk actions
    bulk(action: 'delete') {
        if (action !== 'delete') return;

        const ids = [...this.selected];
        if (!ids.length) return;
        if (!confirm(`Xóa ${ids.length} sản phẩm?`)) return;

        this.loading = true;

        const req$ = (ids.length === 1)
            ? this.svc.delete(ids[0])          // DELETE /products/{id}
            : this.svc.bulkDelete(ids);           // POST /products/bulk-delete

        req$.subscribe({
            next: (res: any) => {
                // Nếu bulk trả 204, không có body → dùng fallback là ids đã gửi
                const deleted = Array.isArray(res?.deletedIds) ? res.deletedIds : ids;
                // Cập nhật UI + clear selection
                this.products = this.products.filter(r => !deleted.includes(r.id));
                this.filtered  = this.filtered .filter((p: Product) => !deleted.includes(p.id));
                this.selected.clear();
                // hoặc gọi this.load() nếu bạn muốn refresh từ BE
                // this.load();
            },
            error: e => alert(`Xóa thất bại: ${e?.status || ''}`),
            complete: () => this.loading = false
        });
    }


    // Toggle stock inline (switch)
    toggleStock(p: Product){
        const prev = p.inStock;
        p.inStock = !prev; // optimistic UI
        this.svc.setStock(p.id, p.inStock).subscribe({
            error: () => p.inStock = prev
        });
    }

    showFilters = false;
    private _bodyOverflow?: string;
    flt = {
        stock: 'all' as 'all' | 'in' | 'out', // tồn kho
        sku: '',                              // mã SKU
        type: null as string | null           // loại (type). Nếu BE dùng categoryId: đổi sang number|null
    };
    types: string[] = [];


    toggleFilters(e: Event) {
        e.stopPropagation();
        this._bodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';     // khoá scroll nền
        this.showFilters = true;
    }
    applyFilters(){
        this.page = 1;
        this.load();
        this.closeFilters();
    }

    clearFilters(){
        this.flt = { stock: 'all', sku: '', type: null };
        this.page = 1;
        this.load();
    }

    closeFilters(){
        this.showFilters = false;
        document.body.style.overflow = this._bodyOverflow || '';
    }
    @HostListener('document:keydown.escape')
    onEsc(){ if (this.showFilters) this.closeFilters(); }


// pages
    goto(n: number) { if (n >= 1 && n <= this.totalPages && n !== this.page){ this.page = n; this.load(); } }
    prev() { if (this.page > 1){ this.page--; this.load(); } }
    next() { if (this.page < this.totalPages){ this.page++; this.load(); } }

    protected readonly name = name;
}
