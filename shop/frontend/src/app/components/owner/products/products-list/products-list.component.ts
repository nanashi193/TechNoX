import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProductService} from '../../../../services/products.service';
import { Product } from '../../../../models/products.model';

@Component({
    standalone: true,
    selector: 'owner-products-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './products-list.component.html',
    styleUrls: ['./products-list.component.css','../../owner-shared.css']
})
export class ProductsListComponent implements OnInit {
    private api = inject(ProductService);
    private router = inject(Router);

    q = ''; page = 0; size = 10; totalItems = 0;
    loading = signal(false);
    rows = signal<Product[]>([]);

    ngOnInit() { this.fetch(); }
    fetch() {
        this.loading.set(true);
        this.api.list({ page: this.page, size: this.size, q: this.q, sort: 'createdAt,desc' })
            .subscribe({
                next: r => { this.rows.set(r.items); this.totalItems = r.totalItems; this.loading.set(false); },
                error: () => { this.loading.set(false); alert('Không tải được danh sách'); }
            });
    }
    search(){ this.page=0; this.fetch(); }
    next(){ if((this.page+1)*this.size>=this.totalItems) return; this.page++; this.fetch(); }
    prev(){ if(this.page===0) return; this.page--; this.fetch(); }
    create(){ this.router.navigate(['/owner/products/new']); }
    edit(p: Product){ this.router.navigate(['/owner/products', p.id]); }
    remove(p: Product){
        if(!confirm(`Xoá "${p.name}"?`)) return;
        this.api.remove(p.id).subscribe({ next: () => this.fetch(), error: () => alert('Xoá thất bại') });
    }

    protected readonly Math = Math;
}
