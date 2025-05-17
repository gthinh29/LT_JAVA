package com.laptrinhjava.task_management_backend.dto;

import java.time.LocalDate;

import com.laptrinhjava.task_management_backend.model.TaskStatus; // Import các annotation Validation

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Lombok: Getters, Setters, toString, equals, hashCode
@NoArgsConstructor // Lombok: constructor không tham số
@AllArgsConstructor // Lombok: constructor với tất cả các thuộc tính
public class TaskRequest {

    // Không bao gồm ID vì client không gửi ID khi tạo/cập nhật (trừ khi update theo ID trong path)

    @NotBlank(message = "Tiêu đề không được để trống") // Không được null và phải chứa ít nhất một ký tự không trắng
    @Size(max = 255, message = "Tiêu đề không được quá 255 ký tự")
    private String title;

    @Size(max = 1000, message = "Mô tả không được quá 1000 ký tự") // Ví dụ giới hạn size cho TEXT
    private String description; // Mô tả có thể rỗng, không cần @NotNull

    @NotNull(message = "Trạng thái không được để trống") // Trạng thái không được null
    private TaskStatus status;

    @FutureOrPresent(message = "Ngày hạn chót phải là ngày hiện tại hoặc trong tương lai") // Ngày hạn chót phải >= ngày hiện tại
    private LocalDate dueDate; // Ngày hạn chót (có thể rỗng, không cần @NotNull)
}