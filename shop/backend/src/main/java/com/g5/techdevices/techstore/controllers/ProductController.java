package com.g5.techdevices.techstore.controllers;


import com.g5.techdevices.techstore.dto.ProductDTO;
import com.g5.techdevices.techstore.dto.ProductImageDTO;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductImages;
import com.g5.techdevices.techstore.services.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.querydsl.QPageRequest;
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
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @PostMapping("")

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
            files = files ==null ? new ArrayList<MultipartFile>() : files;
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
                String fileName = storeFile(file); //thay the lai code ở đây
                //luu vào đối tượng product trong DB => sẽ làm sau
                ProductImages productImage = productService.createProductImages(
                        existingProduct.getId()
                        , ProductImageDTO.builder()
                                .imageUrl(fileName)
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
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

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

    @GetMapping("")
    public ResponseEntity<String> getProducts(
            @RequestParam("page") int page,
            @RequestParam("limit") int limit
    ){
        return ResponseEntity.ok(String.format("getProduct here "));
    }



    @GetMapping("/{id}")
    public ResponseEntity <List<Product>> GetProducts(
            @RequestParam("page") int page,
            @RequestParam("limit") int limit
    ){
        //tao Pageable tu thong tin trang va gioi han
        PageRequest pageRequest = PageRequest.of(
                page, limit,
                Sort.by("createdAt").descending());
        Page<Product> productPage = productService.getAllProducts(pageRequest);
        //lay tong so trang
        int totalPages = productPage.getTotalPages();
        List<Product> products  = productPage.getContent();
        return ResponseEntity.ok(products);
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable long id
    ){
        return ResponseEntity.status(HttpStatus.OK).body("Product delete successful");
    }
}
