package com.g5.techdevices.techstore.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/categories")
public class CategoryController
{
    @GetMapping("")
    public ResponseEntity<String> getAllCategories(){
        return ResponseEntity.ok().body("Haha...");
    }
}
