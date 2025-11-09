package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface BillDetailRepository extends JpaRepository<BillDetail, Long> {
    List<BillDetail> findByBillId(Long billId);

    @Query(value = """
        WITH P1 AS (
          SELECT bd.ProductId,
                 SUM(bd.Quantity)                         AS sold1,
                 SUM(bd.Quantity * bd.UnitPrice)          AS revenue1,
                 AVG(CAST(bd.UnitPrice AS DECIMAL(18,2))) AS avgPrice1
          FROM BillDetail bd
          JOIN Bill b ON b.BillId = bd.BillId
          WHERE b.Status IN ('Succeed','Confirmed')
            AND b.OrderDate >= :start AND b.OrderDate < :end
          GROUP BY bd.ProductId
        ),
        P0 AS (
          SELECT bd.ProductId,
                 SUM(bd.Quantity)                AS sold0,
                 SUM(bd.Quantity * bd.UnitPrice) AS revenue0
          FROM BillDetail bd
          JOIN Bill b ON b.BillId = bd.BillId
          WHERE b.Status IN ('Succeed','Confirmed')
            AND b.OrderDate >= :prevStart AND b.OrderDate < :prevEnd
          GROUP BY bd.ProductId
        )
        SELECT TOP (:limit)
          p.ProductId,
          p.Name           AS productName,
          p.Thumbnail      AS thumbnail,
          ISNULL(P1.sold1, 0)            AS totalSold,
          ISNULL(P1.revenue1, 0)         AS totalRevenue,
          ISNULL(P1.avgPrice1, p.Price)  AS displayPrice,
          CASE
            WHEN ISNULL(P0.revenue0,0) > 0
              THEN CAST(((ISNULL(P1.revenue1,0) - P0.revenue0) * 100.0) / P0.revenue0 AS DECIMAL(7,2))
            WHEN ISNULL(P1.revenue1,0) > 0 THEN 100.00
            ELSE 0.00
          END AS changePct
        FROM Product p
        LEFT JOIN P1 ON P1.ProductId = p.ProductId
        LEFT JOIN P0 ON P0.ProductId = p.ProductId
        WHERE ISNULL(P1.revenue1,0) > 0
        ORDER BY totalRevenue DESC
        """, nativeQuery = true)
    List<Map<String, Object>> topProductsWithTrend(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("prevStart") LocalDateTime prevStart,
            @Param("prevEnd") LocalDateTime prevEnd,
            @Param("limit") int limit
    );
}
