import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    ReactiveFormsModule,
    Validators,
    NonNullableFormBuilder,
    FormControl,
    FormGroup,
    FormArray
} from '@angular/forms';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ProductService} from "../../../../services/products.service";
import {Product} from '../../../../models/products.model';
import {take} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';
import {
    ProductFormValue,
    ProductCreateDTO,
    ProductUpdateDTO,
    toCreateProductDTO,
    toUpdateProductDTO
} from "../../../../dtos/products/products.dto";


type MediaItem = { id: string; previewUrl: string; file?: File; isUrl?: boolean };
type VariantRow = { name: string; values: string[]; input: string };

type VariantValue = {
    color: string;
    size: string;
    quantity: number;
    price: number;
    sku: string;
    // tránh null nếu bạn đang dùng NonNullableFormBuilder
    // id?: number;
};

type VariantFG = {
    id: FormControl<number | null>;
    color: FormControl<string>;
    size: FormControl<string>;
    quantity: FormControl<number>;
    price: FormControl<number>;
    sku: FormControl<string>;
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
        name: this.fb.control('', {validators: [Validators.required, Validators.maxLength(150)]}),
        type: this.fb.control(''),
        sku: this.fb.control('', {validators: [Validators.required]}),
        description: this.fb.control(''),
        price: this.fb.control(0, {validators: [Validators.required, Validators.min(0)]}),

        categoryId: this.fb.control<number | null>(null),
        variants: this.fb.array<FormGroup<VariantFG>>([]),
        status: this.fb.control(true),
        inStock: this.fb.control(true),
        stockQty: this.fb.control(0, {validators: [Validators.min(0)]}),
        thumbnail: this.fb.control(''),
    });

    get variantsFA() {
        return this.f.get('variants') as FormArray<FormGroup<VariantFG>>;
    }

    private buildVariant(v?: Partial<{
        id: number | null;
        color: string;
        size: string;
        quantity: number;
        price: number;
        sku: string;
    }>) {
        return this.fb.group<VariantFG>({
            id: new FormControl<number | null>(v?.id ?? null),
            color: this.fb.control(v?.color ?? '', {validators: [Validators.required]}),
            size: this.fb.control(v?.size ?? '', {validators: [Validators.required]}),
            quantity: this.fb.control(v?.quantity ?? 0, {validators: [Validators.min(0)]}),
            price: this.fb.control(v?.price ?? 0, {validators: [Validators.min(0)]}),
            sku: this.fb.control(v?.sku ?? '', {validators: [Validators.required]}),
        });
    }

    addVariant(v?: any) {
        this.variantsFA.push(this.buildVariant(v));
    }

    removeVariant(i: number) {
        this.variantsFA.removeAt(i);
    }

    // ===== Media state
    media: MediaItem[] = [];
    dragOver = false;

    // ===== Variants state
    variantNames = ['Size', 'Color', 'Material', 'Style', 'Capacity'];
    variants: VariantRow[] = [{name: 'Size', values: [], input: ''}];

    private original!: ProductFormValue;

    get isEdit() {
        return !!this.id;
    }

    ngOnInit(): void {
        const raw = this.route.snapshot.paramMap.get('id');
        this.id = raw && raw !== 'new' ? Number(raw) : undefined;

        if (this.id) {
            // DETAIL: load và khóa form (view-only). Bấm Edit mới enable.
            this.productService.get(this.id).pipe(take(1)).subscribe(p => {
                this.f.patchValue({
                    name: p.name ?? '',
                    sku: p.sku ?? '',
                    stockQty: (p as any).stockQty ?? 0,        // nếu BE không có thì bỏ
                    description: p.description ?? '',
                    price: p.price ?? 0,
                    status: p.status ?? true,                  // ⬅️ dùng status từ BE
                    inStock: p.status ?? true,                 // nếu toggle đang bám inStock
                    thumbnail: p.thumbnail ?? '',              // ⬅️ KHÔNG phải p.image
                    categoryId: p.categoryId ?? null,          // ⬅️ cần BE trả về id (đã nhắc sửa BE)
                }, {emitEvent: false});

                // dựng lại variants
                this.variantsFA.clear();
                (p.variants ?? []).forEach((v: any) => this.addVariant(v));

                this.originalValue = this.f.getRawValue();
                this.original = this.f.getRawValue() as ProductFormValue;   // snapshot cho discard()
                this.setEditMode(false);
            });
        } else {
            this.setEditMode(true);
            this.original = this.f.getRawValue() as ProductFormValue;
        }
    }


    // ===== Save
    async save() {
        if (this.f.invalid) { this.f.markAllAsTouched(); return; }

        // 1) Lấy mảng biến thể từ FormArray (đã typed)
        const variantsVal = this.variantsFA.controls.map(g => g.getRawValue());

        // 2) Dựng ProductFormValue từ các control của form
        const rawForm: ProductFormValue = {
            name: this.f.controls.name.value,
            sku: this.f.controls.sku.value,
            description: this.f.controls.description.value,
            price: this.f.controls.price.value,
            status: this.f.controls.status.value,
            categoryId: this.f.controls.categoryId.value,
            thumbnail: this.f.controls.thumbnail.value,
            variants: variantsVal,

            type: this.f.controls.type.value ?? '',
            inStock: !!this.f.controls.inStock.value,
            stockQty: this.f.controls.stockQty.value ?? 0,
            image: this.f.controls.thumbnail.value ?? ''   // nếu không có control image, dùng thumbnail
        };

        if (this.id) {
            // ===== UPDATE (Partial)
            const dto: ProductUpdateDTO = toUpdateProductDTO(rawForm);
            await firstValueFrom(this.productService.update(this.id, dto));

            this.originalValue = this.f.getRawValue();
            this.f.markAsPristine();
            this.setEditMode(false);

        } else {
            // ===== CREATE (bắt buộc có categoryId số)
            if (rawForm.categoryId == null) {
                this.f.controls.categoryId.setErrors({ required: true });
                this.f.markAllAsTouched();
                return;
            }
            const dto: ProductCreateDTO = toCreateProductDTO(rawForm);
            const created = await firstValueFrom(this.productService.create(dto));
            if (created?.id) this.router.navigate(['/owner/products', created.id]);
            else this.router.navigate(['/owner/products']);
        }
    }



    setEditMode(on: boolean) {
        this.editing = on;
        on ? this.f.enable({emitEvent: false}) : this.f.disable({emitEvent: false});
        this.variantsDisabled = !on; // nếu không có Variants, giữ cũng không sao
    }

    edit() {
        this.setEditMode(true);
    }

    cancel() {
        if (this.originalValue) {
            this.f.reset(this.originalValue, {emitEvent: false});
            this.f.markAsPristine();
        }
        this.setEditMode(!!this.id ? false : true);
    }

    get showStickyBar() {         // nếu HTML đang dùng thanh sticky khi có thay đổi
        return this.editing && this.f.dirty;
    }

    discard() {
        if (this.f.dirty && !confirm('Discard all unsaved changes?')) return;

        const { variants, ...rest } = this.original;

        // map null -> undefined để hợp kiểu NonNullable controls
        const scalars = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, v === null ? undefined : v])
        ) as any;

        this.f.reset(scalars, { emitEvent: false });

        this.variantsFA.clear();
        for (const v of variants ?? []) this.variantsFA.push(this.buildVariant(v));

        this.f.markAsPristine();
        this.f.markAsUntouched();
    }



    // ===== Media handlers
    onDragOver(e: DragEvent) {
        e.preventDefault();
        this.dragOver = true;
    }

    onDragLeave(_e: DragEvent) {
        this.dragOver = false;
    }

    onDrop(e: DragEvent) {
        e.preventDefault();
        this.dragOver = false;
        const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
        this.pushFiles(files);
    }

    onFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = Array.from(input.files ?? []).filter(f => f.type.startsWith('image/'));
        this.pushFiles(files);
        input.value = '';
    }

    addMediaFromUrl() {
        const url = prompt('Paste image URL');
        if (!url) return;
        this.media.push({id: crypto.randomUUID(), previewUrl: url, isUrl: true});
    }

    removeMedia(i: number) {
        const m = this.media[i];
        if (m?.file) URL.revokeObjectURL(m.previewUrl);
        this.media.splice(i, 1);
    }

    private pushFiles(files: File[]) {
        for (const f of files) {
            const preview = URL.createObjectURL(f);
            this.media.push({id: crypto.randomUUID(), previewUrl: preview, file: f});
        }
        // auto fill vào field image nếu đang trống (thumbnail chính)
        if (!this.f.value.thumbnail && this.media[0]) {
            this.f.patchValue({thumbnail: this.media[0].previewUrl});
        }
    }

    // ===== Variant handlers
    addOption() {
        if (this.variants.length < 3) this.variants.push({name: 'Color', values: [], input: ''});
    }

    removeOption(i: number) {
        this.variants.splice(i, 1);
    }

    onTagKeydown(ev: KeyboardEvent, i: number) {
        const k = ev.key;
        if (k === 'Enter' || k === ',' || k === 'Tab') {
            ev.preventDefault();
            const raw = (this.variants[i].input ?? '').trim().replace(/,$/, '');
            if (!raw) return;
            for (const part of raw.split(',').map(s => s.trim()).filter(Boolean)) {
                if (!this.variants[i].values.includes(part)) this.variants[i].values.push(part);
            }
            this.variants[i].input = '';
        }
    }

    removeTag(i: number, v: string) {
        this.variants[i].values = this.variants[i].values.filter(x => x !== v);
    }
}
