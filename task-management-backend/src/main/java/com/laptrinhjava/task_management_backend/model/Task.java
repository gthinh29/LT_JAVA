package com.laptrinhjava.task_management_backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType; // Thêm import
import jakarta.persistence.GeneratedValue; // Giữ nguyên từ file gốc của bạn
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Trạng thái không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status; // Đảm bảo TaskStatus.java đã được tạo/cập nhật

    @Column(name = "due_date")
    private LocalDate dueDate; // Giữ nguyên kiểu LocalDate từ file gốc

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Mối quan hệ với Project
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id") // Tên cột khoá ngoại trong bảng tasks
                                     // nullable = true theo mặc định, nghĩa là task có thể không thuộc project nào
                                     // Nếu task bắt buộc phải có project, thêm (nullable = false)
    @ToString.Exclude // Tránh vòng lặp toString với Project
    private Project project; // Đảm bảo Project.java đã được tạo
    
    // Mối quan hệ với User (người được giao task)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id") // Tên cột khoá ngoại trong bảng tasks
                                      // nullable = true theo mặc định, nghĩa là task có thể không được giao cho ai
    @ToString.Exclude // Tránh vòng lặp toString với User
    private User assignee; // Đảm bảo User.java đã được tạo/cập nhật


    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Lombok @Data đã bao gồm toString().
    // @ToString.Exclude trên các trường quan hệ giúp tránh StackOverflowError.
}
