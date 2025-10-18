package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.ProductDTO;
import com.g5.techdevices.techstore.dtos.ProductImageDTO;
import com.g5.techdevices.techstore.entity.products.Category;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductImages;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InvalidParamException;
import com.g5.techdevices.techstore.repositories.CategoryRepository;
import com.g5.techdevices.techstore.repositories.ProductImageRepository;
import com.g5.techdevices.techstore.repositories.ProductRepository;
import com.g5.techdevices.techstore.responses.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Optional;
import org.springframework.transaction.annotation.Transactional; //Them rollback


@Service
@Transactional(rollbackFor = Exception.class) // NOTE: thêm rollbackFor = Exception.class để rollback cả checked exception
@RequiredArgsConstructor
public class ProductService implements  IProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;


    @Override
    public Product createProduct(ProductDTO productDTO) throws DataNotFoundException {
        Category existingCategory = categoryRepository
                .findById(productDTO.getCategoryId())
                .orElseThrow(() ->
                        new DataNotFoundException(
                                "Cannot find category with id: "+productDTO.getCategoryId()));

            Product newProduct = Product.builder()
                    .name(productDTO.getName())
                    .price(productDTO.getPrice())
                    .description(productDTO.getDescription())
                    .thumbnail(productDTO.getThumbnail())
                    .category(existingCategory)
                    .status(true)
                    .build();
        return productRepository.save(newProduct);
    }

    @Override
    @Transactional(readOnly = true) // NOTE: thêm readOnly để tăng hiệu năng
    public Product getProductById(Long productId) throws Exception {
        Optional<Product> optionalProduct = productRepository.findDetailById(productId);
        if(optionalProduct.isPresent()) {
            return optionalProduct.get();
        }
        throw new DataNotFoundException("Cannot find product with id =" + productId);
    }



    @Override
    @Transactional(readOnly = true) // NOTE: thêm readOnly
    public Page<ProductResponse> getAllProducts(PageRequest pageRequest) {
        return productRepository
                .findAll(pageRequest)
                .map(ProductResponse::fromProduct);
    }

    @Override
    public Product updateProduct(
            Long id,
            ProductDTO productDTO)
            throws Exception {

        Product existingProduct = getProductById(id);
        if (existingProduct != null){
            Category existingCategory = categoryRepository
                    .findById(productDTO.getCategoryId()).
                    orElseThrow(() ->
                            new DataNotFoundException("Cannot find category with id: " + productDTO.getCategoryId()));
            existingProduct.setName(productDTO.getName());
            existingProduct.setPrice(productDTO.getPrice());
            existingProduct.setDescription(productDTO.getDescription());
            existingProduct.setThumbnail(productDTO.getThumbnail());
            existingProduct.setCategory(existingCategory);
            // ✅ Cập nhật trạng thái (true = còn hàng, false = tạm ngừng)
            existingProduct.setStatus(productDTO.getStatus());
        }
        return productRepository.save(existingProduct);
    }


    @Override
    public void deleteProduct(Long id) {
        Optional<Product>optionalProduct= productRepository.findById(id);
        optionalProduct.ifPresent(productRepository::delete);
    }


    @Override
    @Transactional(readOnly = true) // NOTE: chỉ đọc
    public boolean existsByName(String name) {
        return productRepository.existsByNameIgnoreCase(name);
    }


    @Override
    public ProductImages createProductImages(Long productId
            , ProductImageDTO productImageDTO) throws Exception {
        Product existingProduct = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new DataNotFoundException(
                                "Cannot find prodcut with id: "+productImageDTO.getProductId()));
                ProductImages newProductImages = ProductImages
                        .builder()
                        .product(existingProduct)
                        .imageUrl(productImageDTO.getImageUrl())
                        .build();
                //khong cho insert qua 5 anh cho 1 san pham
                int size = productImageRepository.findByProductId(productId).size();
                if(size >= ProductImages.MAXIMUM_IMAGES_PER_PRODUCT){
                    throw new InvalidParamException("Number update must be <= "
                    + ProductImages.MAXIMUM_IMAGES_PER_PRODUCT);
                }
                return productImageRepository.save(newProductImages);
    }

}
