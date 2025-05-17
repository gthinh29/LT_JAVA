package com.laptrinhjava.task_management_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.laptrinhjava.task_management_backend.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    // Spring Data JPA sẽ cung cấp sẵn các phương thức CRUD cơ bản
}