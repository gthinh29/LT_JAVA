    package com.laptrinhjava.task_management_backend.dto;

    import jakarta.validation.constraints.NotBlank;
    import jakarta.validation.constraints.Size;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class ProjectRequestDTO {

        @NotBlank(message = "Tên dự án không được để trống")
        @Size(min = 3, max = 100, message = "Tên dự án phải từ 3 đến 100 ký tự")
        private String name;

        @Size(max = 500, message = "Mô tả dự án không được quá 500 ký tự")
        private String description;

        @Size(max = 30, message = "Mã màu không được quá 30 ký tự")
        private String color;

        @Size(max = 50, message = "Tên icon không được quá 50 ký tự")
        private String iconName;

        private boolean isFavorite = false;
    }
    