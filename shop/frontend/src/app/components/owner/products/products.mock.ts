import { Product } from '../../../models/products.model';

const iso = (d = new Date()) => d.toISOString();
const sku = (seed: number) => String(2380000000 + seed * 713).padEnd(10, '0');

export const MOCK_PRODUCTS: Product[] = [
    { id: 1,  name: 'Photive wireless speakers', type: 'Electronics', sku: sku(1),  price: 65,  variants: 2, inStock: true,  image: 'https://picsum.photos/seed/speaker/80/80',  createdAt: iso(), updatedAt: iso() },
    { id: 2,  name: 'Topman shoe',               type: 'Shoes',       sku: sku(2),  price: 21,  variants: 4, inStock: true,  image: 'https://picsum.photos/seed/shoe1/80/80',   createdAt: iso(), updatedAt: iso() },
    { id: 3,  name: 'RayBan black sunglasses',   type: 'Accessories', sku: sku(3),  price: 37,  variants: 1, inStock: false, image: 'https://picsum.photos/seed/glasses/80/80', createdAt: iso(), updatedAt: iso() },
    { id: 4,  name: "Mango Women's shoe",        type: 'Shoes',       sku: sku(4),  price: 65,  variants: 3, inStock: true,  image: 'https://picsum.photos/seed/shoe2/80/80',   createdAt: iso(), updatedAt: iso() },
    { id: 5,  name: 'Calvin Klein t-shirts',     type: 'Clothing',    sku: sku(5),  price: 89,  variants: 7, inStock: false, image: 'https://picsum.photos/seed/tee1/80/80',    createdAt: iso(), updatedAt: iso() },
    { id: 6,  name: 'Givenchy perfume',          type: 'Clothing',    sku: sku(6),  price: 99,  variants: 1, inStock: true,  image: 'https://picsum.photos/seed/perfume/80/80', createdAt: iso(), updatedAt: iso() },
    { id: 7,  name: 'Asos t-shirts',             type: 'Clothing',    sku: sku(7),  price: 17,  variants: 4, inStock: false, image: 'https://picsum.photos/seed/tee2/80/80',    createdAt: iso(), updatedAt: iso() },
    { id: 8,  name: 'Apple AirPods 2',           type: 'Electronics', sku: sku(8),  price: 249, variants: 1, inStock: true,  image: 'https://picsum.photos/seed/airpods/80/80', createdAt: iso(), updatedAt: iso() },
    { id: 9,  name: 'iPhone 15 Pro',             type: 'Electronics', sku: sku(9),  price: 999, variants: 2, inStock: true,  image: 'https://picsum.photos/seed/iphone/80/80',  createdAt: iso(), updatedAt: iso() },
    { id:10,  name: 'MacBook Air 13',            type: 'Electronics', sku: sku(10), price: 1099,variants: 3, inStock: true,  image: 'https://picsum.photos/seed/mac/80/80',     createdAt: iso(), updatedAt: iso() },
    { id:11,  name: 'Apple Watch S9',            type: 'Electronics', sku: sku(11), price: 399, variants: 2, inStock: false, image: 'https://picsum.photos/seed/watch/80/80',   createdAt: iso(), updatedAt: iso() },
    { id:12,  name: 'iPad Air',                  type: 'Electronics', sku: sku(12), price: 599, variants: 2, inStock: true,  image: 'https://picsum.photos/seed/ipad/80/80',    createdAt: iso(), updatedAt: iso() },
];
