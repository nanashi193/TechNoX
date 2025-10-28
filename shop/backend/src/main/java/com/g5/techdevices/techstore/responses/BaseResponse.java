package com.g5.techdevices.techstore.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.MappedSuperclass;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@MappedSuperclass

public class BaseResponse {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("CreatedAt")
    private LocalDateTime createAt;

}
