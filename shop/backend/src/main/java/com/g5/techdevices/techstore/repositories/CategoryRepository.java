package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.products.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

}
