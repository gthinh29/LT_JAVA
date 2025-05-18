package com.laptrinhjava.task_management_backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList; // Giữ lại import để dễ bật lại
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "app_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3 đến 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 100, message = "Tên không được quá 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Email không được để trống")
    // @Email(message = "Email không hợp lệ") // << TẠM THỜI COMMENT LẠI DÒNG NÀY
    @Size(max = 100, message = "Email không được quá 100 ký tự")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String avatarUrl;

    @Size(max = 50, message = "Vai trò không được quá 50 ký tự")
    @Column(length = 50)
    private String role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Project> projects = new ArrayList<>();

    @OneToMany(mappedBy = "assignee", cascade = CascadeType.DETACH, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Task> assignedTasks = new ArrayList<>();


    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if ((this.username == null || this.username.trim().isEmpty()) && this.email != null && !this.email.isEmpty()) {
            this.username = this.email.split("@")[0];
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
