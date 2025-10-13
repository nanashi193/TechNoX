import {Component, Input} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {NewProduct} from "../../../../models/dashboard.models";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-new-products',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage, RouterLink],
    templateUrl: './new-products.component.html',
    styleUrls: ['./new-products.component.css']
})
export class NewProductsComponent {
    newProducts = [
        { image: '/assets/demo/new1.jpg', name: 'AirPods Max – Silver', date: '10/10/2025' },
        { image: '/assets/demo/new2.jpg', name: 'MacBook Pro M4 – Space Black', date: '08/10/2025' },
        { image: '/assets/demo/new3.jpg', name: 'iPhone 16 Pro – Natural Titanium', date: '06/10/2025' },
    ];
}
// @Input() newProducts: NewProduct[] = []; TODO

