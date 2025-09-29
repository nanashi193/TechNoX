package com.g5.techdevices.techstore;

import com.g5.techdevices.techstore.entity.products.Product;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;

@SpringBootApplication
public class Main
{
	public static void main(String[] args)
	{
//        getAllProducts();
    }
    public static void getAllProducts()
    {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("techstorePU");
        EntityManager em = emf.createEntityManager();
        List<Product> ds = em.createQuery("FROM Product", Product.class).getResultList();
        for (Product p : ds)
        {
            System.out.println(p);
        }
        em.close();
    }
}
