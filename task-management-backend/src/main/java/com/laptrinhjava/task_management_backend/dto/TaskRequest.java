package com.laptrinhjava.task_management_backend.dto;

import java.time.LocalDate;

import com.laptrinhjava.task_management_backend.model.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Trạng thái không được để trống")
    private TaskStatus status;

    private LocalDate dueDate;

    // Trường này BẮT BUỘC phải có
    private Long projectId; 
    
    // Trường này BẮT BUỘC phải có
    private Long assigneeId;
}
