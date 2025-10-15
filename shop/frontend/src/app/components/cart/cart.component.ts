import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Product {
    id: number | string;
    name: string;
    price: number;
    imageUrl?: string;
    sku?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    get subtotal(): number;
}

const LS_KEY = 'cart_demo_v1';

@Component({
    selector: 'app-cart',
    standalone: true,                         // <-- bật standalone
    imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe], // <-- import pipe & modules
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

    // mock products để demo "Thêm nhanh" khi cart trống
    demoProducts: Product[] = [
        { id: 1, name: 'Tai nghe Bluetooth', price: 450000, imageUrl: 'https://picsum.photos/seed/ear/200' },
        { id: 2, name: 'Bàn phím cơ',       price: 1250000, imageUrl: 'https://picsum.photos/seed/kb/200' },
        { id: 3, name: 'Chuột gaming',      price: 390000, imageUrl: 'https://picsum.photos/seed/m/200' }
    ];

    items: CartItem[] = [];

    ngOnInit(): void {
        this.loadFromStorage();
    }

    // ==== helpers ====
    private saveToStorage() {
        localStorage.setItem(LS_KEY, JSON.stringify(
            this.items.map(i => ({ product: i.product, quantity: i.quantity }))
        ));
    }

    private loadFromStorage() {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        try {
            const parsed: Array<{product: Product; quantity: number}> = JSON.parse(raw);
            this.items = parsed.map(({product, quantity}) => this.makeItem(product, quantity));
        } catch { /* ignore */ }
    }

    private makeItem(product: Product, quantity: number): CartItem {
        return {
            product,
            quantity,
            get subtotal() { return product.price * quantity; }
        };
    }

    // ==== computed ====
    get totalQuantity(): number {
        return this.items.reduce((s, it) => s + it.quantity, 0);
    }
    get totalAmount(): number {
        return this.items.reduce((s, it) => s + (it.product.price * it.quantity), 0);
    }

    // ==== actions ====
    addQuick(p: Product, q = 1) {
        const idx = this.items.findIndex(i => i.product.id === p.id);
        if (idx >= 0) {
            this.items[idx].quantity += q;
            this.items[idx] = this.makeItem(this.items[idx].product, this.items[idx].quantity);
        } else {
            this.items = [...this.items, this.makeItem(p, q)];
        }
        this.saveToStorage();
    }

    inc(item: CartItem) {
        item.quantity += 1;
        this.rebind(item.product.id);
    }

    dec(item: CartItem) {
        if (item.quantity <= 1) return;
        item.quantity -= 1;
        this.rebind(item.product.id);
    }

    updateQty(item: CartItem, v: number) {
        const q = Number.isFinite(v) && v > 0 ? Math.floor(v) : 1;
        item.quantity = q;
        this.rebind(item.product.id);
    }

    remove(item: CartItem) {
        this.items = this.items.filter(i => i.product.id !== item.product.id);
        this.saveToStorage();
    }

    clear() {
        this.items = [];
        localStorage.removeItem(LS_KEY);
    }

    trackById = (_: number, it: CartItem) => it.product.id;

    private rebind(productId: number | string) {
        const i = this.items.findIndex(x => x.product.id === productId);
        if (i >= 0) this.items[i] = this.makeItem(this.items[i].product, this.items[i].quantity);
        this.items = [...this.items]; // trigger change detection
        this.saveToStorage();
    }
}
