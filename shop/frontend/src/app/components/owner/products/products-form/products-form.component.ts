import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { FormsModule } from '@angular/forms';                // <= cần cho ngModel
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../services/products.service';
import { Product } from '../../../../models/products.model';

type MediaItem = { id: string; previewUrl: string; file?: File; isUrl?: boolean };
type VariantRow = { name: string; values: string[]; input: string };

@Component({
    standalone: true,
    selector: 'owner-product-form',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink], // <= FormsModule
    templateUrl: './products-form.component.html',
    styleUrls: ['./products-form.component.css', '../../owner-shared.css'],
})
export class ProductsFormComponent implements OnInit {
    private fb = inject(NonNullableFormBuilder);
    private svc = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    id?: number;

    // ===== Reactive form (không null)
    f = this.fb.group({
        name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(150)] }),
        type: this.fb.control(''),
        sku: this.fb.control('', { validators: [Validators.required] }),
        description: this.fb.control(''),
        price: this.fb.control(0, { validators: [Validators.required, Validators.min(0)] }),
        currency: this.fb.control('VND'),
        variants: this.fb.control(0, { validators: [Validators.min(0)] }),
        inStock: this.fb.control(true),
        stockQty: this.fb.control(0, { validators: [Validators.min(0)] }),
        image: this.fb.control(''),


        // Optional – organization/weight
        vendor: this.fb.control(''),
        category: this.fb.control(''),
        weight: this.fb.control(0),
        weightUnit: this.fb.control('kg'),
    });

    // ===== Media state
    media: MediaItem[] = [];
    dragOver = false;

    // ===== Variants state
    variantNames = ['Size', 'Color', 'Material', 'Style', 'Capacity'];
    variants: VariantRow[] = [{ name: 'Size', values: [], input: '' }];

    original?: {
        name:string; type:string; sku:string; description:string;
        price:number; currency:string; variants:number; inStock:boolean;
        image:string; vendor:string; category:string;
    };

    get isEdit(){ return !!this.id; }
    get showStickyBar(){ return this.isEdit && this.f.dirty; } // hiện banner khi có thay đổi

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.id = idParam ? +idParam : undefined;

        if (this.id) {
            this.svc.get(this.id).subscribe((p: Product) => {
                const patch = {
                    name: p.name,
                    type: p.type ?? '',
                    sku: p.sku,
                    price: p.price,
                    variants: p.variants ?? 0,
                    inStock: !!p.inStock,
                    image: p.image ?? '',
                    stockQty: p.stockQty ?? 0
                    // các field khác (vendor/category/collections/weight...) hiện chưa map từ model
                };
                this.f.patchValue(patch);
                this.f.markAsPristine();
                this.f.markAsUntouched();
            });
        }
    }
    discard(){                       // khôi phục lại snapshot
        if (!this.original) return;
        this.f.reset(this.original);
        this.f.markAsPristine();
        this.f.markAsUntouched();
    }
    // ===== Save
    save(): void {
        // chỉ gửi những trường có trong Product (giữ BE an toàn)
        const v = this.f.getRawValue();
        const dto: Partial<Product> = {
            name: v.name,
            type: v.type || v.category || '',
            sku: v.sku,
            price: v.price,
            variants: v.variants,
            inStock: v.inStock,
            image: v.image,
            stockQty: v.stockQty,
        };

        // Nếu sau này cần: map thêm payload cho media/variants:
        // const variantPayload = this.variants.map(o => ({ name: o.name, values: o.values }));
        // const filesToUpload = this.media.filter(m => m.file).map(m => m.file);
        // const imageUrls = this.media.filter(m => m.isUrl).map(m => m.previewUrl);

        const done = () => this.router.navigate(['/owner/products']);
        if (this.id) this.svc.update(this.id, dto).subscribe(done);
        else this.svc.create(dto).subscribe(done);
    }

    // ===== Media handlers
    onDragOver(e: DragEvent){ e.preventDefault(); this.dragOver = true; }
    onDragLeave(_e: DragEvent){ this.dragOver = false; }
    onDrop(e: DragEvent){
        e.preventDefault(); this.dragOver = false;
        const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
        this.pushFiles(files);
    }
    onFileSelect(e: Event){
        const input = e.target as HTMLInputElement;
        const files = Array.from(input.files ?? []).filter(f => f.type.startsWith('image/'));
        this.pushFiles(files); input.value = '';
    }
    addMediaFromUrl(){
        const url = prompt('Paste image URL');
        if (!url) return;
        this.media.push({ id: crypto.randomUUID(), previewUrl: url, isUrl: true });
    }
    removeMedia(i: number){
        const m = this.media[i];
        if (m?.file) URL.revokeObjectURL(m.previewUrl);
        this.media.splice(i, 1);
    }
    private pushFiles(files: File[]){
        for (const f of files){
            const preview = URL.createObjectURL(f);
            this.media.push({ id: crypto.randomUUID(), previewUrl: preview, file: f });
        }
        // auto fill vào field image nếu đang trống (thumbnail chính)
        if (!this.f.value.image && this.media[0]) {
            this.f.patchValue({ image: this.media[0].previewUrl });
        }
    }

    // ===== Variant handlers
    addOption(){ if (this.variants.length < 3) this.variants.push({ name: 'Color', values: [], input: '' }); }
    removeOption(i: number){ this.variants.splice(i, 1); }
    onTagKeydown(ev: KeyboardEvent, i: number){
        const k = ev.key;
        if (k === 'Enter' || k === ',' || k === 'Tab'){
            ev.preventDefault();
            const raw = (this.variants[i].input ?? '').trim().replace(/,$/, '');
            if (!raw) return;
            for (const part of raw.split(',').map(s => s.trim()).filter(Boolean)) {
                if (!this.variants[i].values.includes(part)) this.variants[i].values.push(part);
            }
            this.variants[i].input = '';
        }
    }
    removeTag(i:number, v:string){
        this.variants[i].values = this.variants[i].values.filter(x => x !== v);
    }
}
