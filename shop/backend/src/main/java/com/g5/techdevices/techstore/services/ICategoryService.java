package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dto.CategoryDTO;
import com.g5.techdevices.techstore.entity.products.Category;

import java.util.List;

public interface ICategoryService {
    Category createCategory(CategoryDTO category);
    Category getCategoryById(long id);
    List<Category> getAllCategories();
    Category updateCategory(long categoryId,CategoryDTO category);
    void deleteCategory(long categoryId);
}
