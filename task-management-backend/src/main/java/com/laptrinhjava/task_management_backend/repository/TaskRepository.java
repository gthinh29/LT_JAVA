package com.laptrinhjava.task_management_backend.repository;

import java.util.List;
import java.util.Optional; // Import TaskStatus nếu bạn có query theo status

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // Import nếu dùng @Query

import com.laptrinhjava.task_management_backend.model.Task; // Import nếu dùng @Query với @Param

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Tìm tất cả các task thuộc về một project cụ thể (dựa trên project.id)
    List<Task> findByProjectId(Long projectId);

    // Tìm tất cả các task thuộc về một danh sách các project IDs
    List<Task> findByProjectIdIn(List<Long> projectIds);
    
    // Tìm tất cả các task được giao cho một user cụ thể (dựa trên assignee.id)
    List<Task> findByAssigneeId(Long assigneeId);

    // Tìm tất cả các task thuộc về một project cụ thể VÀ được giao cho một user cụ thể
    List<Task> findByProjectIdAndAssigneeId(Long projectId, Long assigneeId);

    // Tìm task theo ID và project ID (hữu ích để kiểm tra task có thuộc project đó không)
    Optional<Task> findByIdAndProjectId(Long id, Long projectId);

    // Ví dụ: Tìm các task theo trạng thái cho một project cụ thể
    // List<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status);

    // Ví dụ: Đếm số lượng task trong một project
    // long countByProjectId(Long projectId);

    // Bạn có thể thêm các phương thức truy vấn phức tạp hơn bằng @Query nếu cần
    // Ví dụ:
    // @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND (t.title LIKE %:keyword% OR t.description LIKE %:keyword%)")
    // List<Task> findByProjectIdAndKeyword(@Param("projectId") Long projectId, @Param("keyword") String keyword);
}
