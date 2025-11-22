# --- Giai đoạn 1: Build (Dùng Maven) ---
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# KỸ THUẬT 1: Tối ưu Cache
# Copy file cấu hình trước để tải thư viện
COPY pom.xml .
# Lệnh này sẽ tải toàn bộ thư viện về và lưu vào Cache của Docker
# Nếu lần sau bạn không sửa pom.xml, bước này sẽ được bỏ qua (tức thì)
RUN mvn dependency:go-offline -B

# Sau đó mới copy source code vào
COPY src ./src
# Build ra file .jar (Bỏ qua test để nhanh hơn)
RUN mvn clean package -DskipTests

# --- Giai đoạn 2: Run (Dùng Distroless) ---
# KỸ THUẬT 2: Dùng Image Distroless của Google (Siêu nhẹ & Bảo mật)
# "nonroot" nghĩa là chạy với quyền user thường, an toàn hơn root
FROM gcr.io/distroless/java21-debian12:nonroot
#for debug
#FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]