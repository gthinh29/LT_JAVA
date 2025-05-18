    package com.laptrinhjava.task_management_backend.dto;

    import java.time.LocalDateTime;

    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class ProjectResponseDTO {
        private Long id;
        private String name;
        private String description;
        private String color;
        private String iconName;
        private boolean isFavorite;
        private int taskCount;
        private Long ownerId;
        private String ownerName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    