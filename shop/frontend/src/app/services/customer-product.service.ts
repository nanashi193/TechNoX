import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import { environment } from '../environments/environment';

// SỬA 1: Đảm bảo CustomerProductPage được import
import { CustomerProduct, CustomerProductPage } from '../models/customer-product.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerProductService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiBaseUrl}/customer/products`;

    /**
     * Lấy danh sách sản phẩm (phân trang) cho trang customer.
     * ... (comments giữ nguyên)
     */
    getProducts(
        pageIndex: number,
        pageSize: number,
        category?: string,
        searchTerm?: string,
        sortKey?: string
        // SỬA 2: Đổi Observable<CustomerProduct> -> Observable<CustomerProductPage>
    ):Observable<CustomerProductPage> {

        let params = new HttpParams()
            .set('page', pageIndex.toString())
            .set('size', pageSize.toString());

        // Logic param của bạn đã CHÍNH XÁC
        if (category && category !== 'all') {
            params = params.set('categoryName', category);
        }
        if (searchTerm) {
            params = params.set('search', searchTerm);
        }
        if (sortKey && sortKey !== 'relevance') {
            params = params.set('sort', sortKey);
        }

        // SỬA 3: Đổi http.get<CustomerProduct> -> http.get<CustomerProductPage>
        return this.http.get<CustomerProductPage>(this.baseUrl, { params: params });
    }

    /**
     * Lấy chi tiết một sản phẩm theo ID cho trang customer.
     * (Hàm này giữ nguyên, logic map của bạn cho trang chi tiết là OK)
     */
    getProductById(id: number): Observable<CustomerProduct> {
        return this.http.get<CustomerProduct>(`${this.baseUrl}/${id}`).pipe(
            map(product => {
                if (product && product.image) {
                    return {
                        ...product,
                        image: `assets/DTTrungQuoc/${product.image}`
                    };
                }
                return product;
            })
        );
    }
}