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
import {ProductImage} from "../../../../models/product-image.model";

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
};
type CategoryOpt = { id: number; name: string };

const STATIC_CATEGORIES: CategoryOpt[] = [
    { id: 1, name: 'Điện thoại' },
    { id: 2, name: 'Máy tính bảng' },
    { id: 3, name: 'Laptop' },
    { id: 4, name: 'Phụ kiện' },
    { id: 5, name: 'Nội địa trung' },
];

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
    saving = false;
    categories: CategoryOpt[] = STATIC_CATEGORIES;

    id?: number;
    editing = false;
    originalValue: any;
    variantsDisabled = false;

    // ===== Reactive form (không null)
    f = this.fb.group({
        name: this.fb.control('', {validators: [Validators.required, Validators.maxLength(150)]}),
        type: this.fb.control(''),
        sku: this.fb.control(''),
        description: this.fb.control(''),
        price: this.fb.control(0, {validators: [Validators.required, Validators.min(0)]}),

        categoryId: new FormControl<number | null>(null, { validators: [Validators.required] }),
        variants: this.fb.array<FormGroup<VariantFG>>([]),
        status: this.fb.control(true),
        inStock: this.fb.control(true),
        stockQty: this.fb.control(0, {validators: [Validators.min(0)]}),
        thumbnail: this.fb.control(''),
    });

    get variantsFA() {
        return this.f.get('variants') as FormArray<FormGroup<VariantFG>>;
    }

    private buildVariant(v?: Partial<{id:number|null;color:string;size:string;quantity:number;price:number;}>) {
        return this.fb.group<VariantFG>({
            id:       new FormControl<number | null>(v?.id ?? null),
            color:    this.fb.control(v?.color ?? '',    { validators: [Validators.required] }),
            size:     this.fb.control(v?.size ?? '',     { validators: [Validators.required] }),
            quantity: this.fb.control(v?.quantity ?? 0,  { validators: [Validators.min(0)] }),
            price:    this.fb.control(v?.price ?? 0,     { validators: [Validators.min(0)] }),
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
    private hydrateMediaFromServer(p: any) {
        this.media = [];

        // 1) Gom toàn bộ URL ảnh từ nhiều dạng khóa
        const rawList: any[] = (p?.images ?? p?.productImages ?? p?.photos ?? []) as any[];

        // Chuẩn hóa: chấp nhận string hoặc object {url|imageUrl|src}
        const urls = rawList
            .map((it: any) => {
                if (!it) return null;
                if (typeof it === 'string') return it;
                if (typeof it === 'object') return it.url ?? it.imageUrl ?? it.src ?? null;
                return null;
            })
            .filter((u: any): u is string => !!u && typeof u === 'string' && !u.startsWith('blob:'));

        // 2) Thumbnail (fallback lấy ảnh đầu nếu BE chưa set thumbnail)
        const thumb = (p?.thumbnail ?? p?.image ?? p?.imageUrl ?? urls[0] ?? '') as string;

        // 3) Khử trùng và đặt thumbnail lên đầu danh sách
        const unique = Array.from(new Set([thumb, ...urls].filter(Boolean)));

        // 4) Đổ vào media để render gallery
        this.media = unique.map((u, i) => ({ id: `srv-${i}`, previewUrl: u, isUrl: true }));

        // 5) Cập nhật control thumbnail nếu đang rỗng
        if (!this.f.controls.thumbnail.value && thumb) {
            this.f.controls.thumbnail.setValue(thumb, { emitEvent: false });
        }

        // Debug nhanh
        console.log('BE images:', p.images);
        console.log('Media hydrated:', this.media);
    }



    // ===== Variants state
    variants: VariantRow[] = [{name: 'Size', values: [], input: ''}];

    private original!: ProductFormValue;

    get isEdit() {
        return !!this.id;
    }

    ngOnInit(): void {
        const raw = this.route.snapshot.paramMap.get('id');
        this.id = raw && raw !== 'new' ? Number(raw) : undefined;
        this.f.controls.sku.disable({ emitEvent: false });  // ⬅️ luôn disable

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

                this.hydrateMediaFromServer(p);

                // dựng lại variants
                this.variantsFA.clear();
                (p.variants ?? []).forEach((v: any) => this.addVariant({
                    id: v.id ?? v.VariantId ?? null,
                    color: v.color ?? v.Color ?? '',
                    size: v.size ?? v.Size ?? '',
                    quantity: v.quantity ?? v.Quantity ?? 0,
                    price: v.price ?? v.Price ?? 0,
                }));

                if (!this.id && this.variantsFA.length === 0) {
                    this.addVariant({ color:'', size:'', quantity:0, price:0 });
                }

                this.originalValue = this.f.getRawValue();
                this.original = this.f.getRawValue() as ProductFormValue;   // snapshot cho discard()
                this.setEditMode(false);
            });
        } else {
            this.setEditMode(true);
            this.f.markAsPristine();
            this.f.markAsUntouched();
            this.original = this.f.getRawValue() as ProductFormValue;
        }
    }

    // ===== Save
    async save() {
        if (this.f.invalid) { this.f.markAllAsTouched(); return; }
        if (this.saving) return;
        this.saving = true;

        try {
            const raw = this.f.getRawValue();

            // files mới chọn từ dropzone
            const files: File[] = (this.media ?? [])
                .filter(m => !!m.file)
                .map(m => m.file as File);

            // map biến thể (không gửi sku)
            const variants = this.variantsFA.controls.map(g => {
                const { id, color, size, quantity, price } = g.getRawValue();
                const base = {
                    color: (color ?? '').trim(),
                    size: (size ?? '').trim(),
                    quantity: +quantity || 0,
                    price: +price || 0,
                };
                return (this.id && id != null) ? { id, ...base } : base;
            });

            if (this.id) {
                // ===== UPDATE
                const dto: ProductUpdateDTO = {
                    name: raw.name!,
                    price: +raw.price!,
                    thumbnail: raw.thumbnail ?? '',
                    description: raw.description ?? '',
                    status: !!raw.status,
                    ...(raw.categoryId != null ? { categoryId: +raw.categoryId } : {}),
                    variants,
                };

                await firstValueFrom(this.productService.update(this.id, dto));

                if (files.length) {
                    const imgs = await firstValueFrom(this.productService.uploadImages(this.id, files));
                    if ((!raw.thumbnail || !raw.thumbnail.length) && imgs?.length) {
                        await firstValueFrom(this.productService.setThumbnailFromImage(this.id, imgs[0].id));
                    }
                }

                // cập nhật snapshot và thoát edit
                this.originalValue = this.f.getRawValue();
                this.f.markAsPristine();
                this.setEditMode(false);

            } else {
                // ===== CREATE
                if (raw.categoryId == null) {
                    this.f.controls.categoryId.setErrors({ required: true });
                    this.f.markAllAsTouched();
                    return;                         // finally sẽ reset saving
                }

                const dto: ProductCreateDTO = {
                    name: raw.name!,
                    price: +raw.price!,
                    thumbnail: raw.thumbnail ?? '',
                    description: raw.description ?? '',
                    status: !!raw.status,
                    categoryId: +raw.categoryId!,
                    variants,
                };

                const created = await firstValueFrom(this.productService.create(dto));

                if (created?.id && files.length) {
                    const imgs = await firstValueFrom(this.productService.uploadImages(created.id, files));
                    if ((!raw.thumbnail || !raw.thumbnail.length) && imgs?.length) {
                        await firstValueFrom(this.productService.setThumbnailFromImage(created.id, imgs[0].id));
                    }
                    await this.router.navigate(['/owner/products', created.id]);
                } else {
                    await this.router.navigate(['/owner/products']);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.saving = false;                // luôn reset dù nhánh nào / có lỗi
        }
    }



    setEditMode(on: boolean) {
        this.editing = on;
        on ? this.f.enable({ emitEvent:false }) : this.f.disable({ emitEvent:false });
        this.variantsDisabled = !on;
        this.f.controls.sku.disable({ emitEvent:false }); // luôn disable SKU
    }

    edit() {
        this.setEditMode(true);
    }

    get showStickyBar() {
        return this.editing;            // bỏ f.dirty
    }
    cancel() {
        if (this.f.dirty && !confirm('Discard all unsaved changes?')) return;
        this.discard();
        this.setEditMode(false);
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
    }
}
