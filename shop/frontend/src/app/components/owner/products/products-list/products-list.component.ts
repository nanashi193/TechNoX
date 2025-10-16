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

    q = '';
    page = 1; size = 20; total = 0;
    products: Product[] = [];
    filtered: Product[] = [];
    selected = new Set<number>();
    visibleCols = 6;

    ngOnInit(){ this.load(); }

    load(){
        this.svc.search({ q: this.q, page: this.page, size: this.size }).subscribe(res => {
            this.products = res.items;
            this.total = res.total;
            this.filtered = [...this.products];
            this.selected.clear();
        });
    }

    onSearch(){ this.page = 1; this.load(); }

    // Selection helpers
    trackById = (_:number, p:Product)=>p.id;
    isSelected = (id:number) => this.selected.has(id);
    selectedCount(){ return this.selected.size; }
    toggle(id:number, e:Event){ (e.target as HTMLInputElement).checked ? this.selected.add(id) : this.selected.delete(id); }
    allSelected(){ return this.filtered.length>0 && this.filtered.every(p=>this.selected.has(p.id)); }
    toggleAll(e:Event){ const on=(e.target as HTMLInputElement).checked; (on?this.filtered:[]).forEach(p=>this.selected.add(p.id)); if(!on) this.filtered.forEach(p=>this.selected.delete(p.id)); }

    // CRUD hooks
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
}
