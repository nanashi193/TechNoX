package com.g5.techdevices.techstore.entity.Cart;

import com.g5.techdevices.techstore.entity.users.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Cart")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CartId")
    private Long id;

    @OneToOne
    @JoinColumn(name = "UserId", unique = true)
    private User user;

    @OneToMany(mappedBy = "cart")
    private List<CartItem> items;
}
