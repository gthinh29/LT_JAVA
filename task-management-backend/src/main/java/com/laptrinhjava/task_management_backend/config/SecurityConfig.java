package com.laptrinhjava.task_management_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration // Đánh dấu lớp này chứa các định nghĩa Bean cấu hình
@EnableWebSecurity // Kích hoạt cấu hình bảo mật web của Spring Security
public class SecurityConfig {

    // Định nghĩa chuỗi bộ lọc bảo mật (Security Filter Chain)
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(formLogin -> formLogin.disable())
            .httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }


}
