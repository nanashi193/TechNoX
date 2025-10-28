package com.g5.techdevices.techstore.controllers;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/_health")   // -> /api/v1/_health/...
@RequiredArgsConstructor
public class HealthController {

    private final Cloudinary cloudinary;  // inject bean từ CloudinaryConfig

    @GetMapping("/cloudinary")
    public ResponseEntity<?> cloudinaryInfo() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "cloud_name", cloudinary.config.cloudName
        ));
    }

    @GetMapping("/ping")
    public String ping() { return "ok"; }
}