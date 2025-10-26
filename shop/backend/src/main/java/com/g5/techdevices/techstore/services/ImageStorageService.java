package com.g5.techdevices.techstore.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImageStorageService {
    private final Cloudinary cloudinary;

    public Uploaded upload(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty() ||
                file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("File không hợp lệ (image/*)");
        }

        Map<?, ?> res = cloudinary.uploader().upload(
                file.getBytes(),
                Map.of(
                        "folder", folder,
                        "resource_type", "image",
                        "unique_filename", true,
                        "overwrite", false
                )
        );
        return new Uploaded((String) res.get("secure_url"), (String) res.get("public_id"));
    }

    public String buildThumbUrl(String publicId, int w, int h) {
        return cloudinary.url().secure(true)
                .transformation(new Transformation()
                        .width(w).height(h)
                        .crop("fill").gravity("auto")
                        .quality("auto").fetchFormat("auto"))
                .generate(publicId + ".jpg");
    }

    @Data @AllArgsConstructor
    public static class Uploaded {
        private String url;      // secure_url
        private String publicId; // dùng để transform / xoá
    }
}
