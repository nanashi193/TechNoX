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
export class ProductsFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private svc = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    id?: number;
    f = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        type: [''],
        sku: ['', Validators.required],
        price: [0, [Validators.required, Validators.min(0)]],
        variants: [0, [Validators.min(0)]],
        inStock: [true],
        image: ['']
    });

    ngOnInit(){
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam){
            this.id = +idParam;
            this.svc.get(this.id).subscribe(p => this.f.patchValue(p));
        }
    }

    save(){
        const dto = this.f.value;
        const done = () => this.router.navigate(['/owner/products/list']);
        if (this.id) this.svc.update(this.id, dto).subscribe(done);
        else this.svc.create(dto).subscribe(done);
    }
}
