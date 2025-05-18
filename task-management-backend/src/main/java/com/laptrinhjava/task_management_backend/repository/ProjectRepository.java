package com.laptrinhjava.task_management_backend.repository;

import java.util.List;
import java.util.Optional; // Cần thiết nếu bạn có phương thức tìm theo đối tượng User

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // Nếu dùng custom query với @Query

import com.laptrinhjava.task_management_backend.model.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Tìm tất cả các project thuộc về một owner (User) cụ thể dựa trên đối tượng User
    // List<Project> findByOwner(User owner); // Spring Data JPA tự tạo query

    // Tìm tất cả các project thuộc về một owner (User) cụ thể dựa trên ID của owner
    // Đây là phương thức mà ProjectService đang sử dụng
    List<Project> findByOwnerId(Long ownerId);

    // Tìm một project cụ thể bằng ID của nó VÀ ID của owner
    // Hữu ích để kiểm tra quyền sở hữu trước khi cho phép thao tác (xem, sửa, xóa)
    Optional<Project> findByIdAndOwnerId(Long id, Long ownerId);

    // Bạn có thể thêm các phương thức truy vấn tùy chỉnh khác ở đây nếu cần
    // Ví dụ: Tìm các project được đánh dấu là yêu thích của một user
    // List<Project> findByOwnerIdAndIsFavoriteTrue(Long ownerId);

    // Ví dụ về cách sử dụng @Query để lấy project cùng với số lượng task (nếu không dùng @Formula trong Model)
    // @Query("SELECT p FROM Project p LEFT JOIN FETCH p.tasks WHERE p.owner.id = :ownerId")
    // List<Project> findProjectsAndFetchTasksByOwnerId(@Param("ownerId") Long ownerId);
    // Lưu ý: LEFT JOIN FETCH p.tasks có thể gây ra N+1 query nếu không cẩn thận hoặc nếu có nhiều collection cần fetch.
    // Một cách khác là trả về DTO với taskCount như đã làm trong ProjectService.
}
