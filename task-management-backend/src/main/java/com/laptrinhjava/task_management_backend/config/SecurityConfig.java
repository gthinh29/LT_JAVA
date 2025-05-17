package com.laptrinhjava.task_management_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Vô hiệu hóa bảo vệ CSRF cho API stateless
            .csrf(AbstractHttpConfigurer::disable)

            // Cấu hình quy tắc phân quyền cho các yêu cầu HTTP
            .authorizeHttpRequests(authorize -> authorize
                // Cho phép truy cập TẤT CẢ các request đến các đường dẫn bắt đầu bằng /api/
                .requestMatchers("/api/**").permitAll()
                // Cho phép TẤT CẢ các request còn lại cũng public (cho mục đích test ban đầu)
                .anyRequest().permitAll()
            )
            // Vô hiệu hóa cơ chế login bằng form HTML mặc định (phù hợp cho API)
            .formLogin(formLogin -> formLogin.disable())
            // Vô hiệu hóa cơ chế Basic Authentication mặc định (phù hợp cho API)
            .httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }
}