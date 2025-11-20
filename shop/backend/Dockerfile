# Giai đoạn 1: Build (Dùng Maven để đóng gói code thành file .jar)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
# Lệnh này sẽ tạo ra file .jar trong thư mục target/
RUN mvn clean package -DskipTests

# Giai đoạn 2: Run (Dùng JDK siêu nhẹ để chạy file .jar vừa tạo)
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
# Copy file .jar từ giai đoạn 1 sang giai đoạn 2
COPY --from=build /app/target/*.jar app.jar

# Cổng mà ứng dụng sẽ mở
EXPOSE 8080

# Lệnh chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]