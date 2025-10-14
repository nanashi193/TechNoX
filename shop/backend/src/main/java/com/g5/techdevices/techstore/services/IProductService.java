import com.g5.techdevices.techstore.entity.products.Product;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface IProductService {
    public List<Product> getAllProducts();
}