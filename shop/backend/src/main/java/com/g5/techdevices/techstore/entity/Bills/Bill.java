package com.g5.techdevices.techstore.entity.Bills;

import com.g5.techdevices.techstore.entity.users.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Bill")
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BillId")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "UserId")
    private User user;

    @Column(name = "Total", precision = 18, scale = 2)
    private BigDecimal total;

    @Column(name = "PaymentMethod", length = 250)
    private String paymentMethod;

    @Column(name = "OrderDate")
    private LocalDateTime orderDate;

    @Column(name = "ShippingAddress", columnDefinition = "nvarchar(max)")
    private String shippingAddress;

    @Column(name = "Phone", length = 50)
    private String phone;

    @OneToMany(mappedBy = "bill")
    private List<BillDetail> details;
}