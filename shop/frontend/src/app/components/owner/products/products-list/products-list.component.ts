import {Component, HostListener, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ProductListItem} from "../../../../models/products.model";
import {ProductService} from "../../../../services/products.service";
import {Router, RouterLink} from "@angular/router";
import {CATEGORIES, categoryName, CategoryOpt} from "../../../../../data/categories";

type SortDir = 'asc' | 'desc';
type SortField = 'id' | 'name' | 'price';


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
    categories: CategoryOpt[] = CATEGORIES;

    flt = {
        stock: 'all' as 'all' | 'in' | 'out', // tồn kho
        categoryId: null as number | null           // loại (type). Nếu BE dùng categoryId: đổi sang number|null
    };

    onChangeCategory(v: string) {
        // v là string do radio trả về
        this.flt.categoryId = (v === '' ? null : Number(v));
    }
    // ====== state ======
    q = '';
    page = 1;                 // UI: 1-based
    size = 8;
    total = 0;
    loading = false;

    // Nếu BE dùng page 0-based => bật cờ này
    private apiPageZeroBased = false;

    products: ProductListItem[] = [];
    filtered: ProductListItem[] = [];
    selected = new Set<number>();
    visibleCols = 6;

    showFilters = false;
    private _bodyOverflow?: string;


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
            keyword: this.q || undefined,   // nếu bạn vẫn muốn giữ ô search
            page: this.page,
            limit: this.size
        };

        // tồn kho
        // if (this.flt.stock !== 'all') params.inStock = (this.flt.stock === 'in');

        if (this.flt.categoryId != null) params.category_id = this.flt.categoryId;

        // sort: map 'type' -> 'categoryName' cho BE
        if (this.sort) params.sort = `${this.sort.field}_${this.sort.dir}`;


        this.svc.search(params).subscribe({
            next: (res: any) => {
                const raw: any[] = (res.items ?? res.content ?? res) as any[];

                const items: ProductListItem[] = raw.map(p => {
                    const categoryId   = p.categoryId   ?? p.CategoryId   ?? null;
                    const catName = p.categoryName ?? p.CategoryName ?? categoryName(categoryId);

                    const vs = Array.isArray(p.variants) ? p.variants : [];
                    const prices = vs.map((v:any) => Number(v.price) || 0).filter((n: number) => n > 0);
                    const fallback = Number(p.price) || 0;
                    const minPrice = prices.length ? Math.min(...prices) : fallback;
                    const maxPrice = prices.length ? Math.max(...prices) : minPrice;

                    return {
                        ...p,
                        categoryId,
                        categoryName: catName,
                        type: p.type ?? categoryName ?? '',
                        minPrice,
                        maxPrice,
                        hasPriceRange: minPrice !== maxPrice
                    } as ProductListItem;
                });
                this.products = items;
                this.filtered = [...items];

                // gom các type có trong trang hiện tại để show select (tuỳ chọn)
                this.types = Array.from(
                    new Set(items.map(p => p.categoryName).filter(Boolean) as string[])
                ).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

                this.total =
                    (res as any).total ??
                    (res as any).totalCount ??
                    (res as any).totalElements ??
                    ((res as any).totalPages ? (res as any).totalPages * this.size : this.products.length);

                const tp = this.totalPages;
                if (this.page > tp) { this.page = tp; if (tp > 0) this.load(); else this.loading = false; return; }

                this.selected.clear();
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }
    sortBy(field: SortField) {
        if (!this.sort || this.sort.field !== field) this.sort = { field, dir: 'asc' };
        else if (this.sort.dir === 'asc') this.sort = { field, dir: 'desc' };
        else this.sort = null; // clear sort

        this.page = 1;
        this.load();
    }

    isAsc  = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'asc';
    isDesc = (f: SortField) => this.sort?.field === f && this.sort?.dir === 'desc';
    ariaSort(f: SortField){ return this.isAsc(f)?'ascending':this.isDesc(f)?'descending':'none'; }


    onSearch(){ this.page = 1; this.load(); }

    // Selection
    trackById = (_:number, p:ProductListItem)=>p.id;
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
                this.filtered  = this.filtered .filter((p: ProductListItem) => !deleted.includes(p.id));
                this.selected.clear();
                // hoặc gọi this.load() nếu bạn muốn refresh từ BE
                this.load();
            },
            error: (err) => {
                if (err.status === 409) {
                    alert(err.error?.message ||
                        'Không thể xóa: sản phẩm đang trong giỏ hàng của khách. Hãy đợi khách mua hoặc liên hệ admin.');
                }
            },
            complete: () => this.loading = false
        });
    }


    // Toggle stock inline (switch)
    toggleStock(p: ProductListItem){
        const prev = p.inStock;
        p.inStock = !prev; // optimistic UI
        this.svc.setStock(p.id, p.inStock).subscribe({
            error: () => p.inStock = prev
        });
    }

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
        this.flt = { stock: 'all', categoryId: null };
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
