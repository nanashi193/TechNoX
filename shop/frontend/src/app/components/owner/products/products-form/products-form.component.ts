import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService} from '../../../../services/products.service';
import { Product } from '../../../../models/products.model';

@Component({
    standalone: true,
    selector: 'owner-product-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './products-form.component.html',
    styleUrls: ['./products-form.component.css','../../owner-shared.css']
})
export class ProductFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ProductService);

    id = Number(this.route.snapshot.paramMap.get('id'));     // NaN nếu /new

    isEdit: boolean = !Number.isNaN(this.id);

    loading = signal(false);
    preview = signal<string | null>(null);

    form = this.fb.nonNullable.group({
        sku: ['', [Validators.required, Validators.maxLength(64)]],
        name: ['', [Validators.required, Validators.maxLength(200)]],
        price: [0, [Validators.required, Validators.min(0)]],
        oldPrice: [null as number | null],            // cho phep null
        categoryId: [0, Validators.required],
        inStock: [true],
        stockQty: [0, [Validators.required, Validators.min(0)]],
        thumbnailUrl: [''],
        tags: [''],
        description: ['']
    });

    ngOnInit() {
        if (this.isEdit) {
            this.loading.set(true);
            this.api.get(this.id).subscribe({
                next: (p: Product) => {
                    this.form.patchValue({
                        sku: p.sku,
                        name: p.name,
                        price: p.price,
                        oldPrice: p.oldPrice ?? null,
                        categoryId: p.categoryId,
                        inStock: p.inStock,
                        stockQty: p.stockQty,
                        thumbnailUrl: p.thumbnailUrl ?? '',
                        tags: (p.tags ?? []).join(', '),
                        description: p.description ?? ''
                    });
                    this.preview.set(p.thumbnailUrl ?? null);
                    this.loading.set(false);
                },
                error: () => { this.loading.set(false); alert('Không tải được sản phẩm'); }
            });
        }
    }

    submit() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        // Lấy raw để có type đúng (không partial)
        const v = this.form.getRawValue();

        // --- Map sang DTO ---
        const base = {
            sku: v.sku || undefined,
            name: v.name || undefined,
            price: v.price ?? undefined,
            oldPrice: v.oldPrice ?? undefined,              // null -> undefined
            categoryId: v.categoryId ?? undefined,
            inStock: v.inStock ?? undefined,
            stockQty: v.stockQty ?? undefined,
            thumbnailUrl: v.thumbnailUrl || undefined,
            description: v.description || undefined,
            tags: parseTags(v.tags)
        };

        // Create: dùng kiểu đầy đủ (loại bỏ undefined bằng spread có điều kiện nếu muốn)
        const createDto: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
            sku: base.sku!,                                  // đã validate required ở form
            name: base.name!,
            price: base.price!,
            oldPrice: base.oldPrice,
            categoryId: base.categoryId!,
            inStock: base.inStock ?? true,
            stockQty: base.stockQty ?? 0,
            thumbnailUrl: base.thumbnailUrl,
            description: base.description,
            tags: base.tags
        };

        // Update: cho phép partial
        const updateDto: Partial<Product> = base;

        this.loading.set(true);
        const req = this.isEdit
            ? this.api.update(this.id, updateDto)
            : this.api.create(createDto);

        req.subscribe({
            next: () => {
                this.loading.set(false);
                alert('Lưu thành công');
                this.router.navigate(['/owner/products']);
            },
            error: () => { this.loading.set(false); alert('Lưu thất bại'); }
        });
    }

    onThumbInput(e: Event) {
        const url = (e.target as HTMLInputElement).value;
        this.preview.set(url || null);
    }
}

/** tách hàm parse tags cho gọn và type-safe */
function parseTags(input: string): string[] {
    return (input ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}
