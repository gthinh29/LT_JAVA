# Giai đoạn 1: Build ứng dụng Spring Boot và tạo file JAR
# Sử dụng Base Image chỉ chứa Java Development Kit (JDK) 23
FROM eclipse-temurin:23-jdk AS builder

# Cài đặt Maven bằng trình quản lý gói của hệ điều hành (apt-get)
# Lệnh này sẽ cập nhật danh sách gói và cài đặt Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Đặt thư mục làm việc trong container build
WORKDIR /app

# Sao chép file cấu hình build (pom.xml) và mã nguồn (src)
COPY pom.xml .
COPY src ./src

# Chạy lệnh build để tạo file JAR
# 'clean package' sẽ tải dependencies và tạo JAR trong thư mục target/
# '-DskipTests' để bỏ qua chạy unit test trong lúc build Docker image (tùy chọn)
RUN mvn clean package -DskipTests

# Giai đoạn 2: Runtime - Chạy ứng dụng từ file JAR đã build
# Sử dụng Base Image chỉ chứa Java Runtime Environment (JRE) 23 - nhỏ gọn hơn JDK
# Sử dụng tag 'eclipse-temurin:23-jre'
FROM eclipse-temurin:23-jre

# Đặt thư mục làm việc trong container runtime
WORKDIR /app

# Sao chép file JAR đã build từ giai đoạn builder vào thư mục làm việc của giai đoạn runtime
# Đảm bảo đường dẫn và tên file JAR khớp với output của lệnh build ở giai đoạn 1
COPY --from=builder /app/target/*.jar app.jar

# Mở cổng mà ứng dụng Spring Boot lắng nghe (mặc định 8080)
EXPOSE 8080

# Lệnh để chạy ứng dụng khi container khởi động
ENTRYPOINT ["java", "-jar", "app.jar"]

