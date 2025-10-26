package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.ProductDTO;
import com.g5.techdevices.techstore.dtos.ProductImageDTO;
import com.g5.techdevices.techstore.dtos.ProductVariantDTO;
import com.g5.techdevices.techstore.entity.products.Category;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductImages;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal; // ADD
import org.springframework.data.domain.Page; // nếu chưa có
//Them rollback


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
        if (productDTO.getVariants() != null && !productDTO.getVariants().isEmpty()) {
            List<ProductVariant> variantEntities = productDTO.getVariants().stream()
                    .map(v -> ProductVariant.builder()
                            .color(v.getColor())
                            .size(v.getSize())
                            .quantity(v.getQuantity())
                            .price(v.getPrice())
                            .sku((v.getSku() == null || v.getSku().isBlank())
                                    ? generateSku(newProduct.getName(), v.getColor(), v.getSize())
                                    : v.getSku())
                            .product(newProduct)        // quan trọng: set quan hệ ngược
                            .build())
                    .toList();
            newProduct.setVariants(variantEntities);
        }
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
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(
            String keyword,
            String sku,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            PageRequest pageRequest
    ) {
        keyword = (keyword == null) ? "" : keyword.trim();
        sku     = (sku == null) ? "" : sku.trim();

        Page<Product> page = productRepository.search(
                keyword, sku, categoryId, minPrice, maxPrice, pageRequest
        );
        return page.map(ProductResponse::fromProduct);
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

        // === ĐẶT HÀM NÀY Ở CUỐI CLASS, TRƯỚC DẤU } CUỐI CÙNG ===
        private String generateSku(String productName, String color, String size) {
            // Làm gọn tên sản phẩm: chỉ giữ chữ & số, viết hoa
            String cleanName = (productName == null ? "PRD" : productName)
                    .replaceAll("[^A-Za-z0-9]", "")
                    .toUpperCase();

            // Rút gọn cho ngắn gọn
            if (cleanName.length() > 10) cleanName = cleanName.substring(0, 10);

            // Ghép các phần lại thành SKU
            String sku = cleanName;
            if (color != null && !color.isBlank()) {
                sku += "-" + color.trim().replaceAll("\\s+", "").toUpperCase();
            }
            if (size != null && !size.isBlank()) {
                sku += "-" + size.trim().replaceAll("\\s+", "").toUpperCase();
            }
            return sku;
        }



    public ProductVariant upsertVariant(Long productId, ProductVariantDTO productVariantDTO) throws Exception {
        // 1️⃣ Lấy product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new DataNotFoundException("Cannot find product id: " + productId));

        ProductVariant variant;

        if (productVariantDTO.getId() != null) {
            // 2️⃣ Nếu có id → update
            variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(productVariantDTO.getId())) // ✅ equals() đúng
                    .findFirst()
                    .orElseThrow(() ->
                            new DataNotFoundException("Variant not found with id: " + productVariantDTO.getId()));

            variant.setColor(productVariantDTO.getColor());
            variant.setSize(productVariantDTO.getSize());
            variant.setQuantity(productVariantDTO.getQuantity());
            variant.setPrice(productVariantDTO.getPrice());
            variant.setSku(
                    (productVariantDTO.getSku() == null || productVariantDTO.getSku().isBlank())
                            ? generateSku(product.getName(), productVariantDTO.getColor(), productVariantDTO.getSize())
                            : productVariantDTO.getSku()
            );

        } else {
            // 3️⃣ Nếu không có id → tạo mới
            variant = ProductVariant.builder()
                    .color(productVariantDTO.getColor())
                    .size(productVariantDTO.getSize())
                    .quantity(productVariantDTO.getQuantity())
                    .price(productVariantDTO.getPrice())
                    .sku(
                            (productVariantDTO.getSku() == null || productVariantDTO.getSku().isBlank())
                                    ? generateSku(product.getName(), productVariantDTO.getColor(), productVariantDTO.getSize())
                                    : productVariantDTO.getSku()
                    )
                    .product(product)
                    .build();

            if (product.getVariants() == null) {
                product.setVariants(new ArrayList<>());
            }
            product.getVariants().add(variant);
        }

        // 4️⃣ Lưu product (cascade = ALL → tự lưu variant)
        productRepository.save(product);

        return variant;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(PageRequest pageRequest) {
        return productRepository
                .findAll(pageRequest)
                .map(ProductResponse::fromProduct);
    }


    // Lưu product sau khi đổi thumbnail
    public Product save(Product product) {
        return productRepository.save(product);
    }

    // Lấy ảnh theo id (dùng trong API đặt thumbnail)
    public ProductImages getProductImageById(Long imageId) throws Exception {
        return productImageRepository.findById(imageId)
                .orElseThrow(() -> new DataNotFoundException("Cannot find product image with id: " + imageId));
    }


}
