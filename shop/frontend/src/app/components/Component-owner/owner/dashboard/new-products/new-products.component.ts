import {Component, Input} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {NewProduct} from "../../../../../models/dashboard.models";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-new-products',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage, RouterLink],
    templateUrl: './new-products.component.html',
    styleUrls: ['./new-products.component.css']
})

export class NewProductsComponent {
    @Input() newProducts: NewProduct[] = [];
    placeholder = 'assets/placeholder.png';
    track = (_: number, p: NewProduct) => p.id;

}

