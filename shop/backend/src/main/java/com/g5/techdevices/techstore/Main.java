package com.g5.techdevices.techstore;

import com.g5.techdevices.techstore.entity.products.Product;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class Main
    //Tao pass thu cong
{
        public static void main(String[] args) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String hash = encoder.encode("123456789");
            System.out.println(hash);
        }
}
