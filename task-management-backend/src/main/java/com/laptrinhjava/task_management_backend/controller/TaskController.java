package com.laptrinhjava.task_management_backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest taskRequest) {
        TaskResponse createdTaskDto = taskService.createTask(taskRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTaskDto);
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getAllTasksByProjectId(@PathVariable Long projectId) {
        List<TaskResponse> tasks = taskService.getAllTasksByProjectIdForCurrentUser(projectId);
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/tasks/assigned")
    public ResponseEntity<List<TaskResponse>> getAllTasksAssignedToCurrentUser() {
        List<TaskResponse> tasks = taskService.getAllTasksAssignedToCurrentUser();
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long taskId) {
        Optional<TaskResponse> taskDto = taskService.getTaskByIdForCurrentUser(taskId);
        return taskDto.map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long taskId, @Valid @RequestBody TaskRequest taskRequest) {
        TaskResponse updatedTaskDto = taskService.updateTask(taskId, taskRequest);
        return ResponseEntity.ok(updatedTaskDto);
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}
