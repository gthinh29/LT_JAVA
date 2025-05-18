package com.laptrinhjava.task_management_backend.repository;

import java.util.Optional; // Đảm bảo import User model

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.laptrinhjava.task_management_backend.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Phương thức để tìm người dùng bằng email
    // CustomOAuth2UserService và UserService sẽ sử dụng phương thức này
    Optional<User> findByEmail(String email);

    // Phương thức để tìm người dùng bằng username (hữu ích cho việc đảm bảo username là duy nhất)
    Optional<User> findByUsername(String username);

    // Bạn có thể thêm các phương thức truy vấn tùy chỉnh khác ở đây nếu cần
    // Ví dụ:
    // boolean existsByEmail(String email);
    // boolean existsByUsername(String username);
}
