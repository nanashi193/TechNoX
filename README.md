# 🛍️ TechNoX - Modern Ecommerce Platform

![GitHub release (latest by date)](https://img.shields.io/github/v/release/nanashi193/TechNoX?color=blue)  
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)  
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0-brightgreen?logo=springboot)  
![Angular](https://img.shields.io/badge/Angular-17-red?logo=angular)

**TechNoX** là nền tảng thương mại điện tử full-stack hiện đại, tối ưu về hiệu năng và khả năng mở rộng. Dự án hỗ trợ toàn bộ luồng mua sắm, từ tìm kiếm sản phẩm đến thanh toán và quản lý đơn hàng.

🌐 **Live Demo:** [https://technoz.site](https://technoz.site)  
🔌 **API Endpoint:** `https://api.technoz.site`

---

## ✨ Tính Năng Nổi Bật

- **Xác thực:** Đăng nhập/Đăng ký an toàn với JWT & phân quyền theo vai trò.
- **Mua sắm:** Tìm kiếm, lọc sản phẩm, quản lý giỏ hàng.
- **Thanh toán:** Tích hợp PayOS cho xử lý thanh toán trực tuyến.
- **Thông báo:** Gửi email xác nhận tự động qua SMTP (Gmail).
- **Media:** Lưu trữ ảnh trên cloud qua Cloudinary.
- **Bảo mật:** Hỗ trợ HTTPS hoàn toàn, thiết lập CORS, mã hóa biến môi trường.

---

## 🛠️ Công Nghệ & Kiến Trúc

### Frontend
- **Framework:** Angular 17 (Standalone Components)
- **Giao diện:** Bootstrap 5, CSS3
- **Triển khai:** Cloudflare Pages (Auto CI/CD)

### Backend
- **Framework:** Spring Boot 3 (Java 21)
- **ORM:** Hibernate / JPA
- **Database:** Microsoft SQL Server 2022
- **Docker:** Docker & Docker Compose
- **Hạ tầng:** Cloudflare Tunnel (Zero Trust) phục vụ public localhost an toàn

---

# 🚀 Installation & Setup

## 💻 Option 1: For Windows / Linux Users (Recommended)

Docker runs natively and stable on these platforms. The system will automatically set up the Database, seed sample data, and start the Backend.

#### **1. Clone & Configure Env**
```bash
git clone https://github.com/nanashi193/TechNoX.git
cd TechNoX
cp .env.example .env
# Open .env and update your credentials (EMAIL, PAYOS, CLOUDINARY...)
```
#### **2. Run with Docker Compose**
```bash
   docker-compose up -d
```
   Wait about 30–60 seconds for SQL Server to initialize and seed data automatically.

## 🍎 Option 2: For macOS (Apple Silicon M1/M2/M3)

Do hạn chế về hiệu năng của SQL Server trên chip Apple Silicon, quá trình khởi tạo Database tự động có thể không hoạt động. Bạn cần làm theo 3 bước sau:

#### **Bước 1: Khởi chạy Docker**

Chạy lệnh sau để bật Database và Backend:
```bash
docker-compose up -d
```
⚠️ Lưu ý: Sau bước này, container technox-db sẽ chạy (xanh), nhưng technox-api sẽ tự động tắt (Exited) do Database chưa có dữ liệu TEStore. Điều này là bình thường.
#### **Bước 2: Nạp dữ liệu (Manual Seeding)**

Sử dụng công cụ quản lý Database của bạn (DBeaver, Azure Data Studio, IntelliJ...):

**Kết nối:**
```bash
Host: localhost

Port: 1433

User: sa

Password: (Mật khẩu bạn đã đặt trong .env)
```
**Chạy Script:**

Mở file: shop/example-data.sql.

Chạy toàn bộ file này (Execute) để tạo Database TEStore, tạo bảng và nạp dữ liệu mẫu.

#### **Bước 3: Khởi động lại Backend**

Sau khi Database đã có dữ liệu, hãy bật lại Backend:
```bash
docker start technox-api
```
Lúc này Backend sẽ kết nối thành công và hệ thống sẵn sàng hoạt động.

>  Mọi đóng góp, phản hồi và pull request đều được chào đón!


