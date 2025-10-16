import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, Validators, ReactiveFormsModule, NonNullableFormBuilder} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService} from '../../../../services/products.service';
import { Product } from '../../../../models/products.model';
type ProductForm = {
    name: string;
    type: string;
    sku: string;
    price: number;
    variants: number;
    inStock: boolean;
    image: string;
};
@Component({
    standalone: true,
    selector: 'owner-product-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './products-form.component.html',
    styleUrls: ['./products-form.component.css','../../owner-shared.css']
})
export class ProductsFormComponent implements OnInit {
    private fb = inject(NonNullableFormBuilder);
    private svc = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    id?: number;

    // Form KHÔNG null (loại bỏ union |null gây lỗi TS)
    f = this.fb.group({
        name: this.fb.control<string>('', { validators: [Validators.required, Validators.maxLength(150)] }),
        type: this.fb.control<string>(''),
        sku: this.fb.control<string>('', { validators: [Validators.required] }),
        price: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(0)] }),
        variants: this.fb.control<number>(0, { validators: [Validators.min(0)] }),
        inStock: this.fb.control<boolean>(true),
        image: this.fb.control<string>(''),
    });

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.id = idParam ? +idParam : undefined;

        if (this.id) {
            this.svc.get(this.id).subscribe((p: Product) => {
                // patch các field có trong form
                this.f.patchValue({
                    name: p.name,
                    type: p.type ?? '',
                    sku: p.sku,
                    price: p.price,
                    variants: p.variants ?? 0,
                    inStock: !!p.inStock,
                    image: p.image ?? '',
                });
            });
        }
    }

    save(): void {
        // getRawValue() trả đúng kiểu ProductForm (không có null)
        const dto = this.f.getRawValue() as Partial<Product>;
        const done = () => this.router.navigate(['/owner/products/list']);

        if (this.id) this.svc.update(this.id, dto).subscribe(done);
        else this.svc.create(dto).subscribe(done);
    }
}