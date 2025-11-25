import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TopProduct} from "../../../../models/top-product.model";
import {RouterLink} from "@angular/router";
import {LucideAngularModule} from "lucide-angular";
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
    selector: 'app-top-products',
    standalone: true,
    imports: [CommonModule, RouterLink, LucideAngularModule, MatTooltipModule],
    templateUrl: './top-products.component.html',
    styleUrls: ['./top-products.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopProductsComponent {
    @Input() title = 'Sản phẩm bán chạy';
    @Input() viewAllLink: string | null = '/owner/products';
    @Input({ required: true }) items!: TopProduct[];

}
