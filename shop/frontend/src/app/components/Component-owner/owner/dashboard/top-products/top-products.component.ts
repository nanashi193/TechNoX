import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {TopProduct} from "../../../../../models/top-product.model";
import {RouterLink} from "@angular/router";
import {LucideAngularModule} from "lucide-angular";

@Component({
    selector: 'app-top-products',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage, RouterLink, LucideAngularModule],
    templateUrl: './top-products.component.html',
    styleUrls: ['./top-products.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopProductsComponent {
    @Input() title = 'Sản phẩm bán chạy';
    @Input() viewAllLink: string | null = '/owner/products';
    @Input({ required: true }) items!: TopProduct[];

    trackByName = (_: number, p: TopProduct) => p.name;
}
