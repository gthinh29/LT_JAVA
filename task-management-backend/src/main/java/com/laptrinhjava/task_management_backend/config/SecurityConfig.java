package com.laptrinhjava.task_management_backend.config;

import java.util.Arrays;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.laptrinhjava.task_management_backend.service.CustomOAuth2UserService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(authorize -> authorize
                // Các path public (ví dụ: trang chủ, trang lỗi, các resource của OAuth2)
                .requestMatchers("/", "/error", "/webjars/**").permitAll()
                .requestMatchers("/login", "/oauth2/**", "/login/oauth2/code/**").permitAll() 
                
                // Các API yêu cầu xác thực
                .requestMatchers("/api/users/me").authenticated() // YÊU CẦU XÁC THỰC
                .requestMatchers("/api/projects", "/api/projects/**").authenticated()
                .requestMatchers("/api/tasks", "/api/tasks/**").authenticated() 
                // Có thể phân quyền chi tiết hơn cho từng method (GET, POST, PUT, DELETE) nếu cần
                // Ví dụ: .requestMatchers(HttpMethod.GET, "/api/tasks/**").permitAll() // Nếu muốn GET tasks là public
                
                .anyRequest().authenticated() 
            )
            .oauth2Login(oauth2Login ->
                oauth2Login
                    .loginPage("/login") // Sẽ được Spring Security xử lý để redirect tới Google
                    .userInfoEndpoint(userInfoEndpoint ->
                        userInfoEndpoint.oidcUserService(oidcUserService())
                    )
                    .successHandler(authenticationSuccessHandler())
            )
            .logout(logout ->
                logout
                    .logoutUrl("/api/logout")
                    .logoutSuccessHandler(logoutSuccessHandler())
                    .invalidateHttpSession(true)
                    .deleteCookies("JSESSIONID")
                    .permitAll()
            )
            .exceptionHandling(exceptions ->
                exceptions.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            );
        return http.build();
    }

    @Bean
    public OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        return customOAuth2UserService;
    }

    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler() {
        return (request, response, authentication) -> {
            System.out.println("====== SecurityConfig: OAuth2 Authentication successful. Principal: " + (authentication != null ? authentication.getName() : "null") + ", Authenticated: " + (authentication != null && authentication.isAuthenticated()) + " ======");
            if (authentication != null && authentication.getPrincipal() instanceof OidcUser) {
                OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
                System.out.println("====== SecurityConfig: Authenticated user email via OIDC: " + oidcUser.getEmail() + " ======");
            }
            // Redirect về frontend với param login_success=true
            response.sendRedirect(frontendUrl + "?login_success=true"); 
        };
    }
    
    @Bean
    public LogoutSuccessHandler logoutSuccessHandler() {
        return (request, response, authentication) -> {
            System.out.println("====== SecurityConfig: Logout successful. Redirecting to frontend login page: " + frontendUrl + "/login ======");
            response.sendRedirect(frontendUrl + "/login?logout_success=true");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        System.out.println("====== SecurityConfig: Configuring CORS for origin: " + frontendUrl + " ======");
        configuration.setAllowedOrigins(Collections.singletonList(frontendUrl));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-Requested-With", "Accept", "Origin", "Cookie")); 
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
