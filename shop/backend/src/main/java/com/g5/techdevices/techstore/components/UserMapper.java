package com.g5.techdevices.techstore.components;

import com.g5.techdevices.techstore.dtos.AddressDTO;
import com.g5.techdevices.techstore.dtos.UserDetailDTO;
import com.g5.techdevices.techstore.entity.users.Address;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    /**
     * Chuyển đổi User Entity sang UserDetailDTO
     */
    public UserDetailDTO toUserDetailDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserDetailDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .isActive(user.getIsActive())
                .createAt(user.getCreatedAt())
                .roleName(user.getRole().getName())
                .address(toAddressDTO(user.getAddress()))
                .build();
    }

    public AddressDTO toAddressDTO(Address address) {
        if (address == null) {
            return null;
        }
        return AddressDTO.builder()
                .addressId(address.getAddressId())
                .line1(address.getLine1())
                .line2(address.getLine2())
                .district(address.getDistrict())
                .city(address.getCity())
                .province(address.getProvince())
                .zipCode(address.getZipCode())
                .build();
    }
//    public StatsDTO calculateUserStats(User user) {
//        // TODO: Viết logic nghiệp vụ thực tế ở đây
//        // Ví dụ: Lấy user.getBills() rồi đếm và tính tổng
//        return StatsDTO.builder()
//                .orders(0)
//                .totalSpent(0.0)
//                .build();
//    }
}