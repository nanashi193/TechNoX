import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Product} from "../../../../models/products.model";
import {ProductService} from "../../../../services/products.service";
import {Router} from "@angular/router";

type ProductRow = {
    id:number; name:string; image:string; type:string;
    sku:string; price:number; variants:number; inStock:boolean;
};

@Component({
    selector: 'app-products-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
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

    ngOnInit(){ this.load(); }

    load(){
        this.loading = true;
        const apiPage = this.apiPageZeroBased ? this.page - 1 : this.page;

        this.svc.search({ q: this.q, page: apiPage, size: this.size }).subscribe((res: any) => {
            const items: Product[] = (res.items ?? res.content ?? res) as Product[];
            this.products = items;
            this.filtered = [...items];

            // nhận nhiều kiểu tên tổng
            this.total = res.total ?? res.totalCount ?? res.totalElements ?? (Array.isArray(items) ? items.length : 0);

            // nếu lỡ xóa làm page hiện tại vượt quá tổng trang -> lùi về trang cuối
            const tp = this.totalPages;
            if (this.page > tp) { this.page = tp; if (tp > 0) this.load(); else this.loading = false; return; }

            // clear chọn của trang hiện tại
            this.selected.clear();
            this.loading = false;
        }, _ => this.loading = false);
    }

    onSearch(){ this.page = 1; this.load(); }

    // Selection
    trackById = (_:number, p:Product)=>p.id;
    isSelected = (id:number) => this.selected.has(id);
    selectedCount(){ return this.selected.size; }

    toggle(id:number, e:Event){ (e.target as HTMLInputElement).checked ? this.selected.add(id) : this.selected.delete(id); }
    allSelected(){ return this.filtered.length>0 && this.filtered.every(p=>this.selected.has(p.id)); }
    toggleAll(e:Event){ const on=(e.target as HTMLInputElement).checked; (on?this.filtered:[]).forEach(p=>this.selected.add(p.id)); if(!on) this.filtered.forEach(p=>this.selected.delete(p.id)); }

    // CRUD
    edit(id:number){ this.router.navigate(['/owner/products', id, 'edit']); }
    create(){ this.router.navigate(['/owner/products', 'new']); }

    removeOne(id:number){
        this.svc.delete(id).subscribe(() => this.load());
    }

    // Bulk actions
    bulk(action:'delete'|'archive'|'publish'|'unpublish'){
        const ids = [...this.selected];
        if (ids.length === 0) return;
        if (action==='delete') this.svc.bulkDelete(ids).subscribe(()=>this.load());
        if (action==='publish') this.svc.bulkPublish(ids).subscribe(()=>this.load());
        if (action==='unpublish') this.svc.bulkUnpublish(ids).subscribe(()=>this.load());
        // 'archive' tuỳ BE: có thể reuse bulkUnpublish hoặc tạo endpoint riêng
    }

    // Toggle stock inline (switch)
    toggleStock(p: Product){
        const prev = p.inStock;
        p.inStock = !prev; // optimistic UI
        this.svc.setStock(p.id, p.inStock).subscribe({
            error: () => p.inStock = prev
        });
    }

// pages
    goto(n: number) { if (n >= 1 && n <= this.totalPages && n !== this.page){ this.page = n; this.load(); } }
    prev() { if (this.page > 1){ this.page--; this.load(); } }
    next() { if (this.page < this.totalPages){ this.page++; this.load(); } }

}
