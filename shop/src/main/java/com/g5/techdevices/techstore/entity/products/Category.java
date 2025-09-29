package com.g5.techdevices.techstore.entity.products;

import jakarta.persistence.Entity;
import lombok.Data;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "Category")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CategoryId")
    private Integer id;

    @Column(name = "Name", nullable = false, columnDefinition = "nvarchar(150)")
    private String name;

    @Column(name = "Description", columnDefinition = "nvarchar(1000)")
    private String description;

    @OneToMany(mappedBy = "category")
    private List<Product> products;
}
