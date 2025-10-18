package com.g5.techdevices.techstore.dtos;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter

public class CategoryDTO {
    @NotEmpty(message = "Category's name can not be empty.")
    private String name;
}
