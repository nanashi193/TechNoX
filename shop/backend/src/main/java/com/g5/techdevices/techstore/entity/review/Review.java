package com.g5.techdevices.techstore.entity.review;

import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.users.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "Review")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ReviewId")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ProductId")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "UserId")
    private User user;

    @Column(name = "Rating")
    private Integer rating;

    @Column(name = "Comment", columnDefinition = "nvarchar(max)")
    private String comment;

    @Column(name = "ReviewDate")
    private LocalDateTime reviewDate;
}

