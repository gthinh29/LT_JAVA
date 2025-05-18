package com.laptrinhjava.task_management_backend.model;

public enum TaskStatus {
    TODO("Cần làm"),
    IN_PROGRESS("Đang làm"),
    DONE("Hoàn thành"),
    CANCELLED("Đã hủy"); // Bạn có thể thêm hoặc bớt trạng thái tùy theo nhu cầu

    private final String displayName;

    TaskStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    // Optional: một phương thức để lấy enum từ string (hữu ích khi xử lý input)
    public static TaskStatus fromString(String text) {
        for (TaskStatus b : TaskStatus.values()) {
            if (b.name().equalsIgnoreCase(text) || b.displayName.equalsIgnoreCase(text)) {
                return b;
            }
        }
        return null; // hoặc throw IllegalArgumentException
    }
}
