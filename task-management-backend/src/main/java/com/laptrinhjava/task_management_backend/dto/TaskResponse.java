package com.laptrinhjava.task_management_backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.laptrinhjava.task_management_backend.model.TaskStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor // Quan trọng: Tạo constructor với tất cả các trường
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Các trường này BẮT BUỘC phải có để khớp với constructor 11 tham số
    private Long projectId;
    private String projectName;
    private Long assigneeId;
    private String assigneeName;
}
