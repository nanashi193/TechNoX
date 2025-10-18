package com.g5.techdevices.techstore.responses;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class ProductListRespones {
    private List<ProductResponse> products;
    private int totalPages;

}
