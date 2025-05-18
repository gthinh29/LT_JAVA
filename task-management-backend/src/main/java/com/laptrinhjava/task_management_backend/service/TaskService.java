package com.laptrinhjava.task_management_backend.service;

import com.laptrinhjava.task_management_backend.dto.TaskRequest;
import com.laptrinhjava.task_management_backend.dto.TaskResponse;
import com.laptrinhjava.task_management_backend.exception.BadRequestException;
import com.laptrinhjava.task_management_backend.exception.ResourceNotFoundException;
import com.laptrinhjava.task_management_backend.exception.UnauthorizedAccessException;
import com.laptrinhjava.task_management_backend.model.Project;
import com.laptrinhjava.task_management_backend.model.Task;
// import com.laptrinhjava.task_management_backend.model.TaskStatus; // Không dùng trực tiếp trong PostConstruct nữa
import com.laptrinhjava.task_management_backend.model.User;
import com.laptrinhjava.task_management_backend.repository.ProjectRepository;
import com.laptrinhjava.task_management_backend.repository.TaskRepository;
import com.laptrinhjava.task_management_backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.beans.factory.annotation.Value; // Không dùng cho defaultUserEmailForDevData nữa
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// import org.springframework.util.StringUtils; // Không dùng cho PostConstruct nữa

// import jakarta.annotation.PostConstruct; // Không dùng PostConstruct nữa
// import java.time.LocalDate; // Không dùng trực tiếp trong PostConstruct nữa
// import java.time.LocalDateTime; // Không dùng trực tiếp trong PostConstruct nữa
// import java.util.ArrayList; // Không dùng cho PostConstruct nữa
// import java.util.Arrays; // Không dùng cho PostConstruct nữa
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    // @Value("${default.user.email:}") // Không cần thiết nếu bỏ PostConstruct
    // private String defaultUserEmailForDevData;

    @Autowired
    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository, 
                       UserRepository userRepository, UserService userService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    private TaskResponse convertToDto(Task task) {
        if (task == null) {
            return null;
        }
        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getDueDate(), 
            task.getCreatedAt(),
            task.getUpdatedAt(),
            task.getProject() != null ? task.getProject().getId() : null,
            task.getProject() != null ? task.getProject().getName() : null,
            task.getAssignee() != null ? task.getAssignee().getId() : null,
            task.getAssignee() != null ? task.getAssignee().getName() : null
        );
    }

    @Transactional
    public TaskResponse createTask(TaskRequest taskRequest) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để tạo task.");
        }

        Task task = new Task();
        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setStatus(taskRequest.getStatus());
        task.setDueDate(taskRequest.getDueDate());

        if (taskRequest.getProjectId() == null) {
            throw new BadRequestException("Task phải thuộc về một dự án (projectId không được để trống).");
        }
        
        Project project = projectRepository.findByIdAndOwnerId(taskRequest.getProjectId(), currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại hoặc bạn không có quyền thêm task vào dự án này. ID dự án: " + taskRequest.getProjectId()));
        task.setProject(project);
        
        if (taskRequest.getAssigneeId() != null) {
            User assignee = userRepository.findById(taskRequest.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Người được giao không tồn tại với ID: " + taskRequest.getAssigneeId()));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(currentUser); 
        }

        Task savedTask = taskRepository.save(task);
        return convertToDto(savedTask);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasksByProjectIdForCurrentUser(Long projectId) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }
        projectRepository.findByIdAndOwnerId(projectId, currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại hoặc bạn không có quyền truy cập. ID dự án: " + projectId));
        
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        return tasks.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasksAssignedToCurrentUser() {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }
        List<Task> tasks = taskRepository.findByAssigneeId(currentUser.getId());
        return tasks.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public Optional<TaskResponse> getTaskByIdForCurrentUser(Long taskId) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
         if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }

        Optional<Task> taskOptional = taskRepository.findById(taskId);
        if (taskOptional.isEmpty()) {
            return Optional.empty();
        }

        Task task = taskOptional.get();
        if (task.getProject() != null && task.getProject().getOwner().getId().equals(currentUser.getId())) {
            return Optional.of(convertToDto(task));
        }
        if (task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId())) {
             return Optional.of(convertToDto(task));
        }
        
        throw new UnauthorizedAccessException("Bạn không có quyền truy cập task này. ID task: " + taskId);
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, TaskRequest taskRequest) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để cập nhật task.");
        }

        Task existingTask = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task không tồn tại với ID: " + taskId));

        boolean canUpdate = false;
        if (existingTask.getProject() != null && existingTask.getProject().getOwner().getId().equals(currentUser.getId())) {
            canUpdate = true;
        } else if (existingTask.getAssignee() != null && existingTask.getAssignee().getId().equals(currentUser.getId())) {
            canUpdate = true; 
        }

        if (!canUpdate) {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật task này. ID task: " + taskId);
        }
            
        existingTask.setTitle(taskRequest.getTitle());
        existingTask.setDescription(taskRequest.getDescription());
        existingTask.setStatus(taskRequest.getStatus());
        existingTask.setDueDate(taskRequest.getDueDate());

        if (taskRequest.getProjectId() == null) {
             throw new BadRequestException("Task phải thuộc về một dự án (projectId không được để trống khi cập nhật).");
        }

        if (!taskRequest.getProjectId().equals(existingTask.getProject().getId())) {
            Project newProject = projectRepository.findByIdAndOwnerId(taskRequest.getProjectId(), currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dự án mới không tồn tại hoặc bạn không có quyền. ID dự án: " + taskRequest.getProjectId()));
            existingTask.setProject(newProject);
        }
        
        if (taskRequest.getAssigneeId() != null) {
            if (existingTask.getAssignee() == null || !taskRequest.getAssigneeId().equals(existingTask.getAssignee().getId())) {
                User newAssignee = userRepository.findById(taskRequest.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người được giao mới không tồn tại với ID: " + taskRequest.getAssigneeId()));
                existingTask.setAssignee(newAssignee);
            }
        } else {
            existingTask.setAssignee(null); 
        }

        Task updatedTaskEntity = taskRepository.save(existingTask);
        return convertToDto(updatedTaskEntity);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để xóa task.");
        }
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task không tồn tại với ID: " + taskId));
        
        if (task.getProject() == null || !task.getProject().getOwner().getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa task này vì không phải là chủ sở hữu dự án. ID task: " + taskId);
        }
        taskRepository.deleteById(taskId);
    }

    // Đã loại bỏ phương thức @PostConstruct initDefaultTasksForDevUser()
}
