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
    getProducts(page: number = 0, size: number = 12): Observable<CustomerProductPage> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

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
        // Gọi API backend lấy chi tiết
        return this.http.get<CustomerProduct>(`${this.baseUrl}/${id}`);
    }

    // Bạn có thể thêm các hàm khác ở đây sau (ví dụ: tìm kiếm, lọc theo category...)
    // searchProducts(keyword: string, categoryId: number | null, page: number, size: number): Observable<CustomerProductPage> { ... }
}