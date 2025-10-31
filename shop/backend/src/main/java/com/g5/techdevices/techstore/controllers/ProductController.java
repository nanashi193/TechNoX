package com.g5.techdevices.techstore.controllers;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.g5.techdevices.techstore.dtos.ProductDTO;
import com.g5.techdevices.techstore.dtos.ProductImageDTO;
import com.g5.techdevices.techstore.dtos.ProductVariantDTO;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductImages;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.responses.ProductListResponse;
import com.g5.techdevices.techstore.responses.ProductResponse;
import com.g5.techdevices.techstore.services.ImageStorageService;
import com.g5.techdevices.techstore.services.ProductService;
import com.github.javafaker.Faker;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("${api.prefix}/products")

public class ProductController {
    private final ProductService productService;
    // thêm vào class (cạnh ProductService)
    private final ImageStorageService storage; // ✅ NEW


    // ===================== CREATE =====================

    @PostMapping(value = "")
    public ResponseEntity<?> createProduct(
            @Valid @RequestBody ProductDTO productDTO,
            //@ModelAttribute ProductDTO productDTO,
            BindingResult result
    ){
        try {
            if (result.hasErrors()){
                List<String> errorMassage = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                return ResponseEntity.badRequest().body(errorMassage);
            }
            Product newProduct = productService.createProduct(productDTO);
            return ResponseEntity.ok(newProduct);
            }catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping(value = "uploads/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    //local host http://localhost:8088/v1/api/products
    public ResponseEntity<?> uploadImage(
            @PathVariable("id") Long productId,
            @ModelAttribute("files") List<MultipartFile> files){
        try {
            Product existingProduct = productService.getProductById(productId);
            files = (files == null) ? new ArrayList<>() : files;
            if (files.size() > ProductImages.MAXIMUM_IMAGES_PER_PRODUCT){
                return ResponseEntity.badRequest().body("You can upload maximum 5 inmages.");
            }

            List<ProductImages> productImages = new ArrayList<>();
            for(MultipartFile file : files){
                if(file.getSize() == 0){
                    continue;
                }
                //ktra kich thuoc va dinh dang
                if(file.getSize() >10 *1024 * 1024){ //10mb
                    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                            .body("File is too large! Maximum file size is 10MB");
                }
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                            .body("File must contain image");
                }
                //luu file va update thumbnaild trong DTO
                var up = storage.upload(file, "techstore/products/" + productId);
                //luu vào đối tượng product trong DB => sẽ làm sau
                ProductImages productImage = productService.createProductImages(
                        existingProduct.getId()
                        , ProductImageDTO.builder()
                                .imageUrl(up.getUrl())
                                .publicId(up.getPublicId())
                                .build()
                );
                productImages.add(productImage);
            }
            return ResponseEntity.ok().body(productImages);
        } catch (Exception e) {
    return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    private String storeFile(MultipartFile file) throws IOException {
        if(!isImageFile(file) || file.getOriginalFilename() == null){
        throw new IOException("Invalid file format");
        }
        String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        //them UUID vao truoc ten file de dam bao la file duy nhat
        String uniqueFilename = UUID.randomUUID().toString() + "_" + fileName;

        // duong dan den thu muc muon luu file
        java.nio.file.Path uploadDir = Paths.get("upload") ;

        //check và tạo thư mục nếu nó không tồn tại
        if(!Files.exists(uploadDir)){
            Files.createDirectories(uploadDir);
        }

        //Đường dẫn đầy đủ file
        java.nio.file.Path destination = Paths.get(uploadDir.toString(), uniqueFilename);

        //sao chép file vào thư mục đích
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        return uniqueFilename;
    }
    private boolean isImageFile(MultipartFile file){
        String contentType = file.getContentType();
        return contentType != null && contentType.startsWith("image/");
    }

    @GetMapping("")
    public ResponseEntity<ProductListResponse> getProducts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "", name = "sku") String sku,
            @RequestParam(defaultValue = "0", name = "category_id") Long categoryId,
            @RequestParam(required = false, name = "min_price") BigDecimal minPrice,
            @RequestParam(required = false, name = "max_price") BigDecimal maxPrice,
            @RequestParam(defaultValue = "id_desc", name = "sort") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Sort sortSpec = switch (sort.toLowerCase()) {
            case "name_asc" -> Sort.by("name").ascending();
            case "name_desc"-> Sort.by("name").descending();
            case "price_asc"-> Sort.by("price").ascending();
            case "price_desc"-> Sort.by("price").descending();
            case "id_asc"   -> Sort.by("id").ascending();
            default         -> Sort.by("id").descending();
        };
        PageRequest pr = PageRequest.of(page, limit, sortSpec);

        Page<ProductResponse> productPage =
                productService.getAllProducts(keyword, sku, categoryId, minPrice, maxPrice, pr);

        ProductListResponse body = ProductListResponse.builder()
                .products(productPage.getContent())
                .totalPages(productPage.getTotalPages())
                .build();

        return ResponseEntity.ok(body);
    }

    //search with id

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            Product product = productService.getProductById(id);
            ProductResponse response = ProductResponse.fromProduct(product);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            // Trả lỗi JSON để FE đọc được, không lỗi parse
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }




    //Delete

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteProduct(@PathVariable long id) {
        productService.deleteProduct(id);          // ném DataNotFoundException nếu không thấy
        return ResponseEntity.noContent().build(); // ✅ 204, không body
    }

    public record BulkIds(List<Long> ids) {}

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String,Object>> bulkDelete(@RequestBody BulkIds body) {
        var ids = body.ids();
        ids.forEach(productService::deleteProduct);
        return ResponseEntity.ok(Map.of("deletedIds", ids));
    }



    //update
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable long id,
            @Valid @RequestBody ProductDTO productDTO
    ){
        try{
             Product updatedProduct = productService.updateProduct(id, productDTO);
            return ResponseEntity.noContent().build();
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }


    // ------------ VARIANTS ---------------------
    @PostMapping("/{productId}/variants")
    public ResponseEntity<?> upsertVariant(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVariantDTO dto
    ) {
        try {
            ProductVariant savedVariant = productService.upsertVariant(productId, dto);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PutMapping("/{productId}/thumbnail/from-image/{imageId}")
    public ResponseEntity<?> setThumbnailFromImage(@PathVariable Long productId,
                                                   @PathVariable Long imageId) {
        try {
            // 1) Lấy product & image
            Product product = productService.getProductById(productId);
            ProductImages img = productService.getProductImageById(imageId);

            // 2) Ảnh phải thuộc đúng product
            if (!img.getProduct().getId().equals(productId)) {
                return ResponseEntity.badRequest().body("Image does not belong to this product");
            }

            // 3) Cập nhật thumbnail = URL Cloudinary của ảnh
            product.setThumbnail(img.getImageUrl());
            productService.save(product);

            // 4) Trả về kết quả
            return ResponseEntity.ok(Map.of(
                    "productId", productId,
                    "thumbnail", product.getThumbnail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
 //=============Delete Image==========================
    @DeleteMapping("/{productId}/images/{imageId}")
    public ResponseEntity<?> deleteImage(
            @PathVariable Long productId,
            @PathVariable Long imageId
    ) {
        try {
            // gọi service để xoá cả Cloudinary + DB
            productService.deleteImageOfProduct(productId, imageId, storage);
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

        }