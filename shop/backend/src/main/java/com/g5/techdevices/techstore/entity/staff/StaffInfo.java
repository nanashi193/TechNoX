package com.g5.techdevices.techstore.entity.staff;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffInfo {
    private int id;
    private String fullName;
    private String phone;
}