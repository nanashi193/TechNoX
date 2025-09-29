package com.g5.techdevices.techstore.entity.users;


import com.g5.techdevices.techstore.entity.products.Product;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "RecentView")
public class RecentView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RecentViewId")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ProductId")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "UserId")
    private User user;

    @Column(name = "ViewDate")
    private LocalDateTime viewDate;
}
