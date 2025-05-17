package com.laptrinhjava.task_management_backend.controller;

import java.util.List; // Import DTO Request
import java.util.Optional; // Import DTO Response

import org.springframework.beans.factory.annotation.Autowired; // Import TaskService
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping; // Import cho validation
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laptrinhjava.task_management_backend.dto.TaskRequest;
import com.laptrinhjava.task_management_backend.dto.TaskResponse;
import com.laptrinhjava.task_management_backend.service.TaskService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
// Cấu hình CORS cho phép mọi nguồn gốc trong quá trình phát triển (chỉ cho DEV!)
// Trong Production, hãy cấu hình rõ ràng các origins được phép
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // --- Các Endpoints API (CRUD) - Sử dụng DTO và Validation ---

    // POST /api/tasks - Tạo Task mới
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest taskRequest) {
        // @Valid: Kích hoạt validation cho đối tượng TaskRequest nhận được từ request body
        // Nếu validation thất bại, Spring sẽ tự động trả về status 400 Bad Request

        TaskResponse createdTaskDto = taskService.createTask(taskRequest);
        // Trả về response với status 201 (Created) và DTO Response của Task đã tạo
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTaskDto);
    }

    // GET /api/tasks - Lấy tất cả Tasks
    @GetMapping
    public List<TaskResponse> getAllTasks() {
        // Gọi Service để lấy danh sách DTO Response
        return taskService.getAllTasks();
        // Spring tự động chuyển đổi List<TaskResponse> thành mảng JSON
    }

    // GET /api/tasks/{id} - Lấy Task theo ID
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        // @PathVariable: Lấy giá trị ID từ URL
        Optional<TaskResponse> taskDto = taskService.getTaskById(id);

        // Xử lý kết quả Optional<DTO>
        if (taskDto.isPresent()) {
            return ResponseEntity.ok(taskDto.get()); // Trả về status 200 OK và DTO
        } else {
            return ResponseEntity.notFound().build(); // Trả về status 404 Not Found
        }
    }

    // PUT /api/tasks/{id} - Cập nhật Task
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest taskRequest) {
         // @Valid: Kích hoạt validation cho DTO Request
        try {
            TaskResponse updatedTaskDto = taskService.updateTask(id, taskRequest);
            return ResponseEntity.ok(updatedTaskDto); // Trả về status 200 OK và DTO đã cập nhật
        } catch (RuntimeException e) {
            // Xử lý ngoại lệ nếu Task không tìm thấy (ném từ Service)
            // Có thể log lỗi chi tiết hơn ở đây nếu cần
            return ResponseEntity.notFound().build(); // Trả về status 404 Not Found
        }
    }

    // DELETE /api/tasks/{id} - Xóa Task
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        try {
            taskService.deleteTask(id);
             // Trả về status 204 (No Content) sau khi xóa thành công
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
             // Xử lý ngoại lệ nếu xóa không thành công
             // Trong trường hợp này, deleteById không ném lỗi cho ID không tồn tại,
             // nên bạn chỉ cần xử lý các lỗi khác có thể xảy ra.
             // Nếu bạn cần trả về 404 khi xóa ID không tồn tại,
             // bạn cần thêm logic kiểm tra sự tồn tại trong Service trước khi gọi deleteById.
             // Ví dụ trả về 500 Internal Server Error cho các lỗi khác.
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}