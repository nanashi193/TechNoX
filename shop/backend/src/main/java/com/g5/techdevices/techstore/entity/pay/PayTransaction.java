package com.g5.techdevices.techstore.entity.pay;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "PayTransaction", schema = "dbo",
        uniqueConstraints = @UniqueConstraint(columnNames = "OrderCode"))
@Getter @Setter
public class PayTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Long id;

    @Column(name = "OrderCode", nullable = false, unique = true)
    private Long orderCode;

    @Column(name = "BillId", nullable = false)
    private Long billId;

    @Column(name = "Amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "Status", nullable = false, length = 20)
    private String status; // PENDING/PAID/CANCELLED/UNKNOWN

    @Column(name = "PayCode", length = 10)
    private String payCode; // "00","07","09"

    @Lob
    @Column(name = "RawWebhook")
    private String rawWebhook;

    @CreationTimestamp
    @Column(name = "CreatedAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt")
    private Instant updatedAt;
}
