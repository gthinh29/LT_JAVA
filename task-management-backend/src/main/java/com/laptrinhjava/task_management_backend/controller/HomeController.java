package com.laptrinhjava.task_management_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // Đánh dấu đây là một Controller trả về dữ liệu trực tiếp (REST)
public class HomeController {

    // Xử lý yêu cầu GET đến đường dẫn gốc "/"
    @GetMapping("/")
    public String home() {
        return "Backend is running!"; // Trả về chuỗi này khi truy cập "/"
    }
}
