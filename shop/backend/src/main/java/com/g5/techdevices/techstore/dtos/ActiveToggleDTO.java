package com.g5.techdevices.techstore.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class ActiveToggleDTO {
    @JsonProperty("IsActive")
    private boolean isActive;
}
