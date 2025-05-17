package com.laptrinhjava.task_management_backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.laptrinhjava.task_management_backend.model.TaskStatus;

import lombok.AllArgsConstructor; // Giữ lại annotation này
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor // Lombok sẽ tự động tạo constructor: TaskResponse(Long id, String title, ..., LocalDateTime updatedAt)
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}