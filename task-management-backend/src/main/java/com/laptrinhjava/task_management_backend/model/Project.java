package com.laptrinhjava.task_management_backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType; // Thêm import
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên dự án không được để trống")
    @Size(min = 3, max = 100, message = "Tên dự án phải từ 3 đến 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @Size(max = 500, message = "Mô tả dự án không được quá 500 ký tự")
    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 30, message = "Mã màu không được quá 30 ký tự")
    @Column(length = 30)
    private String color; // Ví dụ: "bg-blue-500" hoặc "#3B82F6"

    @Size(max = 50, message = "Tên icon không được quá 50 ký tự")
    @Column(length = 50)
    private String iconName; // Tên icon từ Lucide React (ví dụ: "Briefcase")

    @Column(nullable = false)
    private boolean isFavorite = false;

    // Mối quan hệ với User (người tạo/sở hữu project)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false) // nullable = false nếu project bắt buộc phải có owner
    @ToString.Exclude // Tránh vòng lặp toString với User
    private User owner;
    
    // Một project có nhiều tasks
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude // Tránh vòng lặp toString với Task
    private List<Task> tasks = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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
