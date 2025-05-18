# Giai đoạn 1: Build ứng dụng Spring Boot và tạo file JAR
# Sử dụng Base Image chỉ chứa Java Development Kit (JDK) 23 (hoặc phiên bản Java trong pom.xml của bạn)
FROM eclipse-temurin:23-jdk AS builder

# Cài đặt Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Sao chép chỉ file pom.xml để tận dụng cache layer của Docker
COPY pom.xml .

# 2. Tải tất cả các dependency dựa trên pom.xml
# 'dependency:go-offline' tải tất cả dependency cần thiết cho build offline
# Hoặc 'dependency:resolve' chỉ tải những gì cần thiết cho compile/runtime scopes
# Điều này giúp cache layer này nếu pom.xml không thay đổi
RUN mvn dependency:go-offline -B
# Nếu lệnh trên không hoạt động như mong đợi hoặc bạn muốn một cách đơn giản hơn:
# RUN mvn verify clean --fail-never # Tải dependency và build sơ bộ, bỏ qua lỗi để chỉ tập trung tải dependency

# 3. Sao chép mã nguồn
COPY src ./src

# 4. Build ứng dụng và tạo file JAR
# '-DskipTests' để bỏ qua chạy unit test trong lúc build Docker image
RUN mvn clean package -DskipTests -U

# Giai đoạn 2: Runtime - Chạy ứng dụng từ file JAR đã build
# Sử dụng Base Image chỉ chứa Java Runtime Environment (JRE) 23 - nhỏ gọn hơn JDK
FROM eclipse-temurin:23-jre

WORKDIR /app

# Sao chép file JAR đã build từ giai đoạn builder
# Tên file JAR có thể thay đổi dựa trên artifactId và version trong pom.xml
# Sử dụng wildcard (*) để linh hoạt hơn, nhưng tốt nhất là biết tên file JAR cụ thể nếu có thể
COPY --from=builder /app/target/*.jar app.jar

# Mở cổng mà ứng dụng Spring Boot lắng nghe
EXPOSE 8080

# Lệnh để chạy ứng dụng khi container khởi động
# Thêm các Java options nếu cần, ví dụ: -Xmx, -Xms
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
