package com.laptrinhjava.task_management_backend.service;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laptrinhjava.task_management_backend.model.User;
import com.laptrinhjava.task_management_backend.repository.UserRepository;

@Service
public class CustomOAuth2UserService extends OidcUserService {

    @Autowired
    private UserRepository userRepository;

    // Lấy vai trò mặc định từ application.properties
    @Value("${default.user.role}")
    private String defaultUserRole;

    public CustomOAuth2UserService() {
        super();
    }

    /**
     * Loads the user from the OIDC provider (Google) and processes them.
     * This method is called after successful authentication with Google.
     * It either creates a new user in the local database or updates an existing one.
     *
     * @param userRequest The OIDC user request.
     * @return OidcUser The OIDC user.
     * @throws OAuth2AuthenticationException If an error occurs during OAuth2 authentication.
     */
    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. Load the user from OIDC provider (Google)
        OidcUser oidcUser = super.loadUser(userRequest);
        Map<String, Object> attributes = oidcUser.getAttributes();

        String email = (String) attributes.get("email");
        if (!StringUtils.hasText(email)) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        // 2. Check if the user already exists in our database
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            // 2a. User exists, update their information
            user = userOptional.get();
            updateExistingUser(user, attributes);
            System.out.println("Updating existing OAuth2 user: " + email);
        } else {
            // 2b. User does not exist, register them as a new user
            user = registerNewUser(attributes, email);
            System.out.println("Registering new OAuth2 user: " + email);
        }

        // 3. Save the user (either new or updated)
        userRepository.save(user);

        // 4. Return the OidcUser (Spring Security will use this for the Principal)
        // You can also return a custom OidcUser implementation if you need to attach more application-specific details
        // to the Principal, for example, your internal user ID.
        // For now, returning the default oidcUser is fine.
        return oidcUser;
    }

    /**
     * Registers a new user based on attributes from the OIDC provider.
     *
     * @param attributes Attributes from the OIDC provider.
     * @param email User's email.
     * @return User The newly created user entity.
     */
    private User registerNewUser(Map<String, Object> attributes, String email) {
        User newUser = new User();
        newUser.setEmail(email);
        
        // Generate a unique username. Can be based on email or a unique ID from provider.
        // Google's 'sub' (subject) attribute is a good candidate for a provider-specific unique ID.
        String username = (String) attributes.get("sub"); // Google's unique ID for the user
        if (!StringUtils.hasText(username)) { // Fallback if 'sub' is not available
            username = generateUsernameFromEmail(email);
        }
        newUser.setUsername(ensureUniqueUsername(username));

        newUser.setName((String) attributes.get("name"));
        newUser.setAvatarUrl((String) attributes.get("picture")); // Google provides 'picture' for avatar
        
        // Assign a default role
        if (StringUtils.hasText(defaultUserRole)) {
            newUser.setRole(defaultUserRole);
        } else {
            newUser.setRole("ROLE_USER"); // Fallback default role
        }
        
        // Timestamps are handled by @PrePersist
        // newUser.setCreatedAt(LocalDateTime.now());
        // newUser.setUpdatedAt(LocalDateTime.now());

        return newUser;
    }

    /**
     * Updates an existing user's information based on attributes from the OIDC provider.
     *
     * @param existingUser The existing user entity.
     * @param attributes Attributes from the OIDC provider.
     */
    private void updateExistingUser(User existingUser, Map<String, Object> attributes) {
        existingUser.setName((String) attributes.get("name"));
        existingUser.setAvatarUrl((String) attributes.get("picture"));
        // existingUser.setUpdatedAt(LocalDateTime.now()); // Handled by @PreUpdate
        // Optionally, update other fields if they can change in the OIDC provider
    }

    /**
     * Generates a base username from an email address.
     *
     * @param email The email address.
     * @return A base username.
     */
    private String generateUsernameFromEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return "user" + System.currentTimeMillis(); // Fallback for invalid email
        }
        return email.substring(0, email.indexOf('@'));
    }
    
    /**
     * Ensures the generated username is unique. If not, appends a number.
     * @param baseUsername The initial username.
     * @return A unique username.
     */
    private String ensureUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int count = 0;
        while (userRepository.findByUsername(username).isPresent()) {
            count++;
            username = baseUsername + count;
        }
        return username;
    }
}
