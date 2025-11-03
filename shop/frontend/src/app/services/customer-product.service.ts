import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import { environment } from '../environments/environment';
import { CustomerProduct, CustomerProductPage } from '../models/customer-product.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerProductService {
    private http = inject(HttpClient);
    // Sửa base URL trỏ đến API customer
    private baseUrl = `${environment.apiBaseUrl}/customer/products`;
    /**
     * Lấy danh sách sản phẩm (phân trang) cho trang customer.
     * @param page Số trang (0-based)
     * @param size Số lượng trên mỗi trang
     * @returns Observable chứa dữ liệu trang sản phẩm
     */
    getProducts(
        page: number = 0,
        size: number = 12,
        keyword?: string,
        category?: string, // Sẽ là 'all' hoặc một ID
        sort?: string // Sẽ là 'relevance' hoặc 'priceAsc', 'priceDesc'
    ): Observable<CustomerProductPage> {

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        if (keyword) {
            params = params.set('keyword', keyword);
        }
        if (category && category !== 'all') {
            params = params.set('category', category);
        }
        if (sort && sort !== 'relevance') {
            params = params.set('sort', sort);
        }

        // Gọi API backend
        return this.http.get<CustomerProductPage>(this.baseUrl, { params }).pipe(
            map(response => {
                const updatedContent = response.content.map(product => ({
                    ...product,
                    image: `assets/DTTrungQuoc/${product.image}`
                }));

                return { ...response, content: updatedContent };
            })
        );
    }

    /**
     * Lấy chi tiết một sản phẩm theo ID cho trang customer.
     * @param id ID của sản phẩm
     * @returns Observable chứa thông tin chi tiết sản phẩm
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

    // Bạn có thể thêm các hàm khác ở đây sau (ví dụ: tìm kiếm, lọc theo category...)
    // searchProducts(keyword: string, categoryId: number | null, page: number, size: number): Observable<CustomerProductPage> { ... }
}