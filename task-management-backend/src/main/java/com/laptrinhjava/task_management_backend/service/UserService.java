package com.laptrinhjava.task_management_backend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laptrinhjava.task_management_backend.dto.UserResponseDTO;
import com.laptrinhjava.task_management_backend.exception.ResourceNotFoundException;
import com.laptrinhjava.task_management_backend.model.User;
import com.laptrinhjava.task_management_backend.repository.UserRepository;

import jakarta.annotation.PostConstruct;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Value("${default.user.email:}")
    private String defaultUserEmailForDev;

    @Value("${default.user.name:Default Dev User}")
    private String defaultUserNameForDev;

    @Value("${default.user.avatarUrl:}")
    private String defaultUserAvatarUrlForDev;
    
    @Value("${default.user.role:ROLE_USER}")
    private String defaultUserRoleForDev;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private UserResponseDTO convertToDTO(User user) {
        if (user == null) {
            return null;
        }
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getRole()
        );
    }
    
    @PostConstruct
    @Transactional
    protected void createDefaultUserForDevelopmentIfNeeded() {
        if (StringUtils.hasText(defaultUserEmailForDev) && userRepository.count() == 0) {
            if (userRepository.findByEmail(defaultUserEmailForDev).isEmpty()) {
                User devUser = new User();
                String username = defaultUserEmailForDev.split("@")[0];
                int count = 0;
                String finalUsername = username;
                while(userRepository.findByUsername(finalUsername).isPresent()) {
                    count++;
                    finalUsername = username + count;
                }
                devUser.setUsername(finalUsername);
                devUser.setName(defaultUserNameForDev);
                devUser.setEmail(defaultUserEmailForDev);
                devUser.setAvatarUrl(defaultUserAvatarUrlForDev);
                devUser.setRole(defaultUserRoleForDev);
                userRepository.save(devUser);
            }
        }
    }

    @Transactional(readOnly = true)
    public Optional<UserResponseDTO> getAuthenticatedUserFromSecurityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        String userEmail = null;
        // Sử dụng instanceof pattern matching (Java 16+)
        switch (authentication.getPrincipal()) {
            case OidcUser oidcUser -> userEmail = oidcUser.getEmail();
            case OAuth2User oauth2User -> userEmail = oauth2User.getAttribute("email");
            default -> {
            }
        }
        
        if (userEmail != null) {
            return userRepository.findByEmail(userEmail).map(this::convertToDTO);
        }
        
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public User getCurrentAuthenticatedUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null; 
        }
        
        final String emailFromPrincipal;

        // Sử dụng instanceof pattern matching (Java 16+)
        switch (authentication.getPrincipal()) {
            case OidcUser oidcUser -> emailFromPrincipal = oidcUser.getEmail();
            case OAuth2User oauth2User -> emailFromPrincipal = oauth2User.getAttribute("email");
            default -> {
                return null;
            } 
        }

        if (emailFromPrincipal != null) {
            return userRepository.findByEmail(emailFromPrincipal)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + emailFromPrincipal + " while trying to get current authenticated user entity."));
        }
        return null; 
    }
}
