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

## 🚀 Hướng Dẫn Cài Đặt Nhanh (Docker)

Bạn có thể khởi chạy toàn bộ hệ thống (Backend + Database) chỉ với một lệnh nhờ Docker.

### Yêu cầu
- Đã cài đặt Docker Desktop.
- Đã cài đặt Git.

### Các bước thực hiện

1. **Clone repository**
    git clone https://github.com/nanashi193/TechNoX.git
    cd TechNoX

2. **Cấu hình biến môi trường**  
   Tạo file `.env` dựa trên mẫu:  
   cp .env.example .env
   Sau đó mở file `.env` và điền các thông tin thực tế của bạn (Mật khẩu DB, thông tin Mail, Cloudinary, PayOS...)

3. **Khởi động hệ thống**
   docker-compose up -d
   Lệnh này sẽ:
   - Kéo image SQL Server (Azure SQL Edge tối ưu cho chip M1/M2)
   - Khởi tạo database
   - Build và khởi động Spring Boot backend

4. **Truy cập hệ thống**
   - Giao diện người dùng: [http://localhost:4200](http://localhost:4200) (nếu chạy Angular local)
   - Backend API: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
   - Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

>  Mọi đóng góp, phản hồi và pull request đều được chào đón!


