package com.g5.techdevices.techstore.services;
import com.g5.techdevices.techstore.dtos.ProductDTO;
import com.g5.techdevices.techstore.dtos.ProductImageDTO;
import com.g5.techdevices.techstore.dtos.customer.CustomerProductDTO;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductImages;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.responses.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.math.BigDecimal;


public interface IProductService {
   Product createProduct(ProductDTO productDTO) throws Exception;

    Product getProductById(Long id) throws Exception;


    Page<ProductResponse> getAllProducts(PageRequest pageRequest);

    Page<ProductResponse> getAllProducts(
            String keyword,
            String sku,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            PageRequest pageRequest
    );

    Product updateProduct(Long id, ProductDTO  productDTO)throws Exception;

    void deleteProduct(Long id);

    boolean existsByName(String name);
    ProductImages createProductImages(Long productId
            , ProductImageDTO productImageDTO) throws Exception;
    Page<CustomerProductDTO> getProductsForCustomer(Pageable pageable);
    CustomerProductDTO getCustomerProductById(Long id) throws DataNotFoundException; // <-- THÊM HÀM NÀY
}
