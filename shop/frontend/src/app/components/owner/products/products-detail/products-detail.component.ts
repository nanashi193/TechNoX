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
import {Product, ProductImageItem} from '../../../../models/products.model';
import {take} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';
import {
    ProductFormValue,
    ProductCreateDTO,
    ProductUpdateDTO,
} from "../../../../dtos/products/products.dto";
import {ProductImage} from "../../../../models/product-image.model";
import {MediaItem} from "../../../../models/products.model";

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

    deletedVariantIds: number[] = [];

    addVariant(v?: any) {
        this.variantsFA.push(this.buildVariant(v));
        this.f.markAsDirty();
    }

    removeVariant(i: number) {
        const g = this.variantsFA.at(i);
        const id = g.get('id')?.value;
        if (id != null) this.deletedVariantIds.push(id);   // sẽ xoá trên BE
        this.variantsFA.removeAt(i);
        this.f.markAsDirty();
    }

    // ===== Media state
    media: MediaItem[] = [];
    mediaDirty = false;
    trackByUrl = (_: number, m: MediaItem) => m.previewUrl;
    selectedThumb: string | null = null;
    dragOver = false;
    private hydrateMediaFromServer(p: Product | any) {
        this.media = (p.imageItems ?? []).map((it: ProductImageItem, i: number) => ({
            id: `srv-${i}`,
            previewUrl: it.url,
            imageId: it.id,
            isUrl: true
        }));

        const list: any[] = (p.imageItems ?? []);
        const urls = list.map((it: any) =>
            typeof it === 'string' ? { id: undefined, url: it }
                : { id: it.id, url: it.url });

        const thumb = p.thumbnail ?? urls[0]?.url ?? '';
        const unique = Array.from(new Set([thumb, ...urls.map(x => x.url)]));
        this.selectedThumb = thumb;
        this.media = unique.map((u, i) => {
            const found = urls.find(x => x.url === u);
            return { id: `srv-${i}`, previewUrl: u, imageId: found?.id, isUrl: true };
        });

        if (!this.f.controls.thumbnail.value && thumb) {
            this.f.controls.thumbnail.setValue(thumb, { emitEvent: false });
        }
    }


    // ===== Variants state
    variants: VariantRow[] = [{name: 'Size', values: [], input: ''}];

    private original!: ProductFormValue;


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
        if (!this.editing || !this.f.dirty || this.f.invalid || this.saving) {
            this.f.markAllAsTouched();
            return;
        }
        this.saving = true;

        try {
            const raw = this.f.getRawValue();
            const isUpdate = typeof this.id === 'number' && Number.isFinite(this.id);

            // files mới
            const files: File[] = (this.media ?? []).filter(m => !!m.file).map(m => m.file as File);

            // map biến thể từ form
            const variants = this.variantsFA.getRawValue().map(v => ({
                ...(v.id != null ? { id: v.id } : {}),
                color: (v.color ?? '').trim(),
                size: (v.size ?? '').trim(),
                quantity: +v.quantity || 0,
                price: +v.price || 0,
            }));

            if (isUpdate) {
                // ===== UPDATE SCALARS
                const scalarsDto: ProductUpdateDTO = {
                    name: raw.name!,
                    price: +raw.price!,
                    thumbnail: raw.thumbnail ?? '',
                    description: raw.description ?? '',
                    status: !!(raw as any).inStock,
                    ...(raw.categoryId != null ? { categoryId: +raw.categoryId } : {}),
                };
                await firstValueFrom(this.productService.update(this.id!, scalarsDto));

                // ===== UPSERT VARIANTS (mỗi dòng một call)
                await Promise.all(
                    variants.map(v => firstValueFrom(this.productService.upsertVariant(this.id!, v)))
                );

                // ===== DELETE VARIANTS đã xoá trên UI
                await Promise.all(
                    this.deletedVariantIds.map(vid => firstValueFrom(this.productService.deleteVariant(this.id!, vid)))
                );
                this.deletedVariantIds = [];

                // ===== Upload ảnh & thumbnail (nếu cần)
                if (files.length) {
                    const imgs = await firstValueFrom(this.productService.uploadImages(this.id!, files));
                    if ((!raw.thumbnail || !raw.thumbnail.length) && imgs?.length) {
                        await firstValueFrom(this.productService.setThumbnailFromImage(this.id!, imgs[0].id));
                    }
                }

                // refresh & thoát edit
                const fresh = await firstValueFrom(this.productService.get(this.id!));
                this.f.patchValue(fresh);
                this.f.markAsPristine();
                this.setEditMode(false);

            } else {
                // ===== CREATE
                if (raw.categoryId == null) {
                    this.f.controls.categoryId.setErrors({ required: true });
                    this.f.markAllAsTouched();
                    return;
                }

                const createDto: ProductCreateDTO = {
                    name: raw.name!,
                    price: +raw.price!,
                    thumbnail: raw.thumbnail ?? '',
                    description: raw.description ?? '',
                    status: !!(raw as any).inStock,
                    categoryId: +raw.categoryId!,
                    variants, // gửi luôn các biến thể khi tạo
                };

                const created = await firstValueFrom(this.productService.create(createDto));

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
            alert('Lưu thất bại. Vui lòng thử lại.');
        } finally {
            this.saving = false;
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

    setThumb(m: MediaItem) {
        if (this.selectedThumb === m.previewUrl) return;
        this.selectedThumb = m.previewUrl;
        const ctrl = this.f.controls.thumbnail;
        ctrl.setValue(m.previewUrl);
        ctrl.markAsDirty();
        ctrl.markAsTouched();
        this.f.markAsDirty();
        this.f.updateValueAndValidity();

        if (this.id && m.imageId) {
            this.productService.setThumbnailFromImage(this.id, m.imageId).subscribe();
        }
    }
    removeMedia(i: number) {
        const m = this.media[i];
        if (this.id && m.imageId) {
            this.productService.deleteImage(this.id, m.imageId).subscribe(() => {
                this.media.splice(i,1);
                if (this.selectedThumb === m.previewUrl) {
                    this.selectedThumb = this.media[0]?.previewUrl ?? null;
                }
            });
        } else {
            if (m.file) URL.revokeObjectURL(m.previewUrl);
            this.media.splice(i,1);
        }
    }

    onRemove(i: number, ev: MouseEvent) {
        ev.stopPropagation();              // ⬅️ quan trọng
        const m = this.media[i];
        if (!m) return;

        // Optimistic UI
        this.media.splice(i, 1);
        this.media = [...this.media];      // đảm bảo cập nhật view (kể cả OnPush)
        this.mediaDirty = true;

        // Nếu vừa xoá ảnh đang là thumbnail → chọn ảnh kế
        if (this.selectedThumb === m.previewUrl) {
            this.selectedThumb = this.media[0]?.previewUrl ?? null;
            this.f.controls.thumbnail.setValue(this.selectedThumb ?? '', { emitEvent: true });
            this.f.controls.thumbnail.markAsDirty();
        }

        // Gọi API xoá nếu có imageId
        if (this.id && m.imageId) {
            this.productService.deleteImage(this.id, m.imageId).subscribe({
                error: _ => {
                    // rollback khi lỗi
                    this.media.splice(i, 0, m);
                    this.media = [...this.media];
                    this.mediaDirty = false;
                }
            });
        }
    }

    private pushFiles(files: File[]) {
        for (const f of files) {
            const preview = URL.createObjectURL(f);
            this.media.push({id: crypto.randomUUID(), previewUrl: preview, file: f});
        }
    }
}
