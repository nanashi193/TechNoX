package com.g5.techdevices.techstore.entity.Bills;

import com.g5.techdevices.techstore.entity.users.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
    private int id;

    @ManyToOne
    @JoinColumn(name = "UserId")
    private User user;

    @Column(name = "FullName", columnDefinition = "nvarchar(100)")
    private String fullName;

    @Column(name = "Email", columnDefinition = "varchar(100)")
    private String Email;

    @Column(name = "Status", columnDefinition = "varchar(30)")
    private String Status;

    @Column(name = "Total", precision = 18, scale = 2)
    private BigDecimal total;

    @Column(name = "PaymentMethod", length = 250)
    private String paymentMethod;

    @Column(name = "OrderDate")
    private LocalDateTime orderDate;

    @Column(name = "ShippingAddress", nullable = false, columnDefinition = "nvarchar(max)")
    private String shippingAddress;

    @Column(name = "Phone", length = 20)
    private String phone;

    @OneToMany(mappedBy = "bill")
    private List<BillDetail> details;
}