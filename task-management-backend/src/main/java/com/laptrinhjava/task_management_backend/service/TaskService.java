package com.laptrinhjava.task_management_backend.service;

import java.util.List; // Import DTO Request
import java.util.Optional; // Import DTO Response
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.laptrinhjava.task_management_backend.dto.TaskRequest;
import com.laptrinhjava.task_management_backend.dto.TaskResponse;
import com.laptrinhjava.task_management_backend.model.Task;
import com.laptrinhjava.task_management_backend.repository.TaskRepository; // Import cho stream

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // --- Helper method để chuyển đổi Entity sang DTO Response ---
    private TaskResponse convertToDto(Task task) {
        if (task == null) {
            return null;
        }
        // Sử dụng constructor của TaskResponse
        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getDueDate(),
            task.getCreatedAt(),
            task.getUpdatedAt()
        );
        // Hoặc sử dụng các phương thức set nếu dùng Lombok @Data cho TaskResponse
        // TaskResponse dto = new TaskResponse();
        // dto.setId(task.getId()); ... return dto;
    }

    // --- Helper method để chuyển đổi DTO Request sang Entity ---
    private Task convertToEntity(TaskRequest taskRequest) {
        if (taskRequest == null) {
            return null;
        }
        Task task = new Task();
        // Set các thuộc tính từ request
        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setStatus(taskRequest.getStatus());
        task.setDueDate(taskRequest.getDueDate());
        // ID, createdAt, updatedAt sẽ được quản lý bởi JPA và callback
        return task;
    }


    // --- Các phương thức xử lý nghiệp vụ (CRUD) - Sử dụng DTO ---

    // Tạo một Task mới từ DTO Request
    public TaskResponse createTask(TaskRequest taskRequest) {
        // Chuyển DTO Request thành Entity
        Task taskToSave = convertToEntity(taskRequest);
        // Các callback @PrePersist và @PreUpdate trong Entity sẽ tự set thời gian

        // Lưu Entity vào DB
        Task savedTask = taskRepository.save(taskToSave);

        // Chuyển Entity đã lưu thành DTO Response và trả về
        return convertToDto(savedTask);
    }

    // Lấy tất cả Tasks - Trả về danh sách DTO Response
    public List<TaskResponse> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        // Chuyển danh sách Entity thành danh sách DTO Response
        return tasks.stream()
                    .map(this::convertToDto) // Áp dụng hàm convertToDto cho mỗi phần tử
                    .collect(Collectors.toList()); // Thu thập kết quả vào List
    }

    // Lấy một Task theo ID - Trả về Optional<DTO Response>
    public Optional<TaskResponse> getTaskById(Long id) {
        // Tìm Entity theo ID
        Optional<Task> taskOptional = taskRepository.findById(id);

        // Ánh xạ Optional<Entity> sang Optional<DTO>
        // Nếu có Entity, chuyển nó thành DTO; nếu không, Optional vẫn rỗng
        return taskOptional.map(this::convertToDto);
    }

    // Cập nhật một Task từ DTO Request
    public TaskResponse updateTask(Long id, TaskRequest taskRequest) {
        // Tìm Task hiện có theo ID
        Optional<Task> taskOptional = taskRepository.findById(id);

        if (taskOptional.isPresent()) {
            Task existingTask = taskOptional.get();
            // Cập nhật các thuộc tính của Task hiện có bằng dữ liệu từ DTO Request
            existingTask.setTitle(taskRequest.getTitle());
            existingTask.setDescription(taskRequest.getDescription());
            existingTask.setStatus(taskRequest.getStatus());
            existingTask.setDueDate(taskRequest.getDueDate());
            // Các callback trong Entity sẽ tự set updatedAt

            // Lưu lại Task đã cập nhật vào DB
            Task updatedTaskEntity = taskRepository.save(existingTask);

            // Chuyển Entity đã cập nhật thành DTO Response và trả về
            return convertToDto(updatedTaskEntity);
        } else {
            // Xử lý trường hợp không tìm thấy Task (ví dụ: ném ngoại lệ)
            throw new RuntimeException("Task not found with id " + id);
        }
    }

    // Xóa một Task theo ID
    public void deleteTask(Long id) {
         // Có thể thêm kiểm tra taskOptional.isPresent() và ném lỗi nếu không tìm thấy trước khi gọi deleteById
         // Nhưng deleteById của JpaRepository mặc định không ném lỗi nếu không tìm thấy ID
        taskRepository.deleteById(id); // Xóa theo ID
    }

    // Có thể thêm các phương thức nghiệp vụ phức tạp hơn tại đây sau này
}