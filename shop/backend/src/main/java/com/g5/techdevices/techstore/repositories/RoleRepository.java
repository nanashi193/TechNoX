package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.users.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role,Long> {

}
