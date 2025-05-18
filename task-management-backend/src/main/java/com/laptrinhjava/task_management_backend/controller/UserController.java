package com.laptrinhjava.task_management_backend.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laptrinhjava.task_management_backend.dto.UserResponseDTO;
import com.laptrinhjava.task_management_backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
        System.out.println("====== UserController INSTANTIATED (PRODUCTION VERSION) ======");
    }

    @GetMapping("/me")
    @SuppressWarnings("CallToPrintStackTrace")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        System.out.println("====== UserController: /api/users/me ENDPOINT HIT (PRODUCTION CODE) ======");
        try {
            Optional<UserResponseDTO> userOpt = userService.getAuthenticatedUserFromSecurityContext();
            if (userOpt.isPresent()) {
                System.out.println("====== UserController: User found via UserService: " + userOpt.get().getEmail() + " ======");
                return ResponseEntity.ok(userOpt.get());
            } else {
                System.out.println("====== UserController: User not found or not authenticated by UserService, returning 401 ======");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); 
            }
        } catch (Exception e) {
            System.err.println("====== UserController: CRITICAL ERROR in /api/users/me (production code): " + e.getMessage() + " ======");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
