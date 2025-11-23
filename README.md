# 🛍️ TechNoX - Modern Ecommerce Platform

![GitHub release (latest by date)](https://img.shields.io/github/v/release/nanashi193/TechNoX?color=blue) 
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white) 
![Docker Image Size](https://img.shields.io/docker/image-size/nanashi193/technox-backend)   
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0-brightgreen?logo=springboot)  
![Angular](https://img.shields.io/badge/Angular-17-red?logo=angular)

**TechNoX** is a modern full-stack e-commerce platform optimized for performance and scalability. The project supports the entire shopping flow, from product search to checkout and order management.

🌐 **Live Demo:** [https://technoz.site](https://technoz.site)  
🔌 **API Endpoint:** `https://api.technoz.site`

---

## ✨ Main Features

- **Authentication:** Secure login/registration using JWT with role-based authorization.
- **Shopping:** Product search, filtering, and cart management.
- **Checkout:** PayOS integration for online payment processing..
- **Notifications:** Automatic confirmation emails sent via SMTP (Gmail).
- **Media:** Image storage on the cloud via Cloudinary.
- **Security:**  Full HTTPS support, CORS configuration, and encryption of environment variables.

---

## 🛠️ Technology & Architecture

### Frontend
- **Framework:** Angular 17 (Standalone Components)
- **Giao diện:** Bootstrap 5, CSS3
- **Triển khai:** Cloudflare Pages (Auto CI/CD)

### Backend
- **Framework:** Spring Boot 3 (Java 21)
- **ORM:** Hibernate / JPA
- **Database:** Microsoft SQL Server 2022
- **Docker:** Docker & Docker Compose
- **Infrastructure:** Cloudflare Tunnel (Zero Trust) for securely exposing localhost to the public

---

# 🚀 Installation & Setup

## 💻 Option 1: For Windows / Linux Users (Recommended)

Docker runs natively and stable on these platforms. The system will automatically set up the Database, seed sample data, and start the Backend.

### **1. Clone & Configure Env**
```bash
git clone https://github.com/nanashi193/TechNoX.git
cd TechNoX
cp .env.example .env
# Open .env and update your credentials (EMAIL, PAYOS, CLOUDINARY...)
```
### **2. Run with Docker Compose**
```bash
docker-compose up -d
```
> Wait about 30–60 seconds for SQL Server to initialize and seed data automatically.

## 🍎 Option 2: For macOS (Apple Silicon M1/M2/M3)

Due to SQL Server performance limitations on Apple Silicon chips, the automatic database initialization may not work. You need to follow these 3 steps:

### **Step 1: Start Docker**

Run the following command to start the Database and Backend:
```bash
docker-compose up -d
```
>⚠️ Note: After this step, the technox-db container will be running (green), but technox-api will automatically stop (Exited) because the database does not yet contain TEStore data. This is normal.
### **Step 2: Load Data (Manual Seeding)**

Use your database management tool (DBeaver, Azure Data Studio, IntelliJ, etc.):

**Connect:**
```bash
Host: localhost

Port: 1433

User: sa

Password: (Your password in .env)
```
**Run Script:**

Open file:
```bash
 shop/example-data.sql.
```
Execute the entire file to create the TEStore database, set up the tables, and load the sample data.
>If you are using DBeaver, remove all "GO" statements and execute normally.

### **Step 3: Restart Backend**

Once the database contains data, restart the Backend:
```bash
docker start technox-api
```
At this point, the Backend will connect successfully, and the system will be ready to operate.
>  Mọi đóng góp, phản hồi và pull request đều được chào đón!
