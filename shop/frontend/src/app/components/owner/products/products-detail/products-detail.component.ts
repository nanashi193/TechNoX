import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {ProductService} from "../../../../services/products.service";
import { Product } from '../../../../models/products.model';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';


type MediaItem = { id: string; previewUrl: string; file?: File; isUrl?: boolean };
type VariantRow = { name: string; values: string[]; input: string };

type ProductFormValue = {
    name: string; type: string; sku: string; price: number;
    variants: number; inStock: boolean; image: string; stockQty: number;
};

@Component({
    standalone: true,
    selector: 'owner-product-form',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink], // <= FormsModule
    templateUrl: './products-detail.component.html',
    styleUrls: ['./products-detail.component.css', '../../owner-shared.css'],
})
export class ProductsDetailComponent implements OnInit {
    private fb = inject(NonNullableFormBuilder);
    private productService = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    id?: number;
    editing = false;
    originalValue: any;
    variantsDisabled = false;

    // ===== Reactive form (không null)
    f = this.fb.group({
        name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(150)] }),
        type: this.fb.control(''),
        sku: this.fb.control('', { validators: [Validators.required] }),
        description: this.fb.control(''),
        price: this.fb.control(0, { validators: [Validators.required, Validators.min(0)] }),
        variants: this.fb.control(0, { validators: [Validators.min(0)] }),
        inStock: this.fb.control(true),
        stockQty: this.fb.control(0, { validators: [Validators.min(0)] }),
        image: this.fb.control('')
    });

    // ===== Media state
    media: MediaItem[] = [];
    dragOver = false;

    // ===== Variants state
    variantNames = ['Size', 'Color', 'Material', 'Style', 'Capacity'];
    variants: VariantRow[] = [{ name: 'Size', values: [], input: '' }];

    private original!: ProductFormValue;

    get isEdit(){ return !!this.id; }
    ngOnInit(): void {
        const raw = this.route.snapshot.paramMap.get('id');
        this.id = raw && raw !== 'new' ? Number(raw) : undefined;

        if (this.id) {
            // DETAIL: load và khóa form (view-only). Bấm Edit mới enable.
            this.productService.get(this.id).pipe(take(1)).subscribe(p => {
                this.f.reset({
                    name: p.name,
                    sku: p.sku ?? p.sku ?? '',
                    stockQty: p.stockQty ?? 0,
                    description: p.description ?? '',
                    price: p.price ?? 0,
                    inStock: !!p.inStock,
                    image: p.image ?? '',
                }, { emitEvent: false });

                this.originalValue = this.f.getRawValue();
                this.setEditMode(false); // view-only
            });
        } else {
            this.setEditMode(true);
        }
    }
    setEditMode(on: boolean) {
        this.editing = on;
        on ? this.f.enable({ emitEvent: false }) : this.f.disable({ emitEvent: false });
        this.variantsDisabled = !on; // nếu không có Variants, giữ cũng không sao
    }

    edit()  { this.setEditMode(true); }

    cancel() {
        if (this.originalValue) {
            this.f.reset(this.originalValue, { emitEvent: false });
            this.f.markAsPristine();
        }
        this.setEditMode(!!this.id ? false : true);
    }

    get showStickyBar() {         // nếu HTML đang dùng thanh sticky khi có thay đổi
        return this.editing && this.f.dirty;
    }
    discard(){                       // khôi phục lại snapshot
        if (this.f.dirty && !confirm('Discard all unsaved changes?')) return;
        this.f.reset(this.original);
        this.f.markAsPristine();
        this.f.markAsUntouched();
    }
    // ===== Save
    async save() {
        if (this.f.invalid) return;

        const body = {
            ...this.f.getRawValue(),
            // nếu bạn có biến thể/ảnh, thêm vào đây:
            // variants: this.variants,
            // images: this.images,
        };

        if (this.id) {
            // UPDATE
            await firstValueFrom(this.productService.update(this.id, body));
            this.originalValue = this.f.getRawValue();
            this.f.markAsPristine();
            this.setEditMode(false); // quay về view-only
        } else {
            // CREATE
            const created: any = await firstValueFrom(this.productService.create(body));
            // điều hướng sang trang detail vừa tạo (nếu service trả id)
            if (created?.id) {
                this.router.navigate(['/owner/products', created.id]);
            } else {
                this.setEditMode(false);
            }
        }
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
