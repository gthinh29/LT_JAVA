FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Sao chép package.json và lock file để cài đặt dependencies
# Sử dụng lệnh kiểm tra lock file nào tồn tại để dùng lệnh cài đặt tương ứng
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; fi

# Sao chép toàn bộ mã nguồn frontend
COPY . .

# Chạy lệnh build của Next.js
# Cấu hình output standalone để Next.js tạo server minimal
# Thêm biến môi trường NEXT_TELEMETRY_DISABLED=1 để tắt telemetry trong quá trình build
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Giai đoạn 2: Runtime - Chạy ứng dụng đã build
# Sử dụng Base Image nhỏ gọn hơn chỉ cần Node.js để chạy server Next.js
# Sử dụng cùng tag image Node.js 20 LTS trên nền Debian Bookworm Slim
FROM node:20-bookworm-slim

# Đặt biến môi trường cho quá trình chạy
# NEXT_PUBLIC_BACKEND_API_URL sẽ được Next.js embed vào code client-side.
# 'backend' là tên service của backend trong docker-compose.yml
ENV NEXT_PUBLIC_BACKEND_API_URL=http://backend:8080

# Đặt thư mục làm việc
WORKDIR /app

# Sao chép các file cần thiết từ giai đoạn build vào giai đoạn runtime
# Sử dụng output standalone của Next.js (.next/standalone)
# Đã thêm dấu gạch chéo cuối đường dẫn đích theo khuyến nghị
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static/
COPY --from=builder /app/public ./public/

# Mở cổng mà Next.js lắng nghe (mặc định 3000)
EXPOSE 3000

# Lệnh để chạy ứng dụng Next.js server
CMD ["node", "server.js"]
