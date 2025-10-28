package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.CategoryDTO;
import com.g5.techdevices.techstore.entity.products.Category;

import java.util.List;

public interface ICategoryService {
    Category createCategory(CategoryDTO category);
    Category getCategoryById(Integer id);
    List<Category> getAllCategories();
    Category updateCategory(Integer categoryId,CategoryDTO category);
    void deleteCategory(Integer categoryId);
}
