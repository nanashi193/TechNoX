package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.users.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, Long> {
}
