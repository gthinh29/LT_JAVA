package com.laptrinhjava.task_management_backend.service;

import com.laptrinhjava.task_management_backend.dto.ProjectRequestDTO;
import com.laptrinhjava.task_management_backend.dto.ProjectResponseDTO;
import com.laptrinhjava.task_management_backend.exception.ResourceNotFoundException;
import com.laptrinhjava.task_management_backend.exception.UnauthorizedAccessException;
import com.laptrinhjava.task_management_backend.model.Project;
import com.laptrinhjava.task_management_backend.model.User;
import com.laptrinhjava.task_management_backend.repository.ProjectRepository;
import com.laptrinhjava.task_management_backend.repository.UserRepository; // Cần để lấy user mặc định

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // Cần cho default user email
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils; // Cần cho PostConstruct

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;
    private final UserRepository userRepository; 

    @Value("${default.user.email:}")
    private String defaultUserEmailForDevData;

    @Autowired
    public ProjectService(ProjectRepository projectRepository, UserService userService, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    private ProjectResponseDTO convertToDTO(Project project) {
        if (project == null) {
            return null;
        }
        return new ProjectResponseDTO(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getColor(),
                project.getIconName(),
                project.isFavorite(),
                project.getTasks() != null ? project.getTasks().size() : 0,
                project.getOwner() != null ? project.getOwner().getId() : null,
                project.getOwner() != null ? project.getOwner().getName() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> getAllProjectsForCurrentUser() {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để lấy danh sách dự án.");
        }
        return projectRepository.findByOwnerId(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponseDTO getProjectByIdForCurrentUser(Long id) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để xem dự án.");
        }
        Project project = projectRepository.findByIdAndOwnerId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại hoặc bạn không có quyền truy cập. ID: " + id));
        return convertToDTO(project);
    }

    @Transactional
    public ProjectResponseDTO createProject(ProjectRequestDTO projectRequestDTO) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để tạo dự án.");
        }
        Project project = new Project();
        project.setName(projectRequestDTO.getName());
        project.setDescription(projectRequestDTO.getDescription());
        project.setColor(projectRequestDTO.getColor());
        project.setIconName(projectRequestDTO.getIconName());
        project.setFavorite(projectRequestDTO.isFavorite());
        project.setOwner(currentUser);
        
        Project savedProject = projectRepository.save(project);
        return convertToDTO(savedProject);
    }

    @Transactional
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO projectRequestDTO) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để cập nhật dự án.");
        }
        Project project = projectRepository.findByIdAndOwnerId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại hoặc bạn không có quyền cập nhật. ID: " + id));

        project.setName(projectRequestDTO.getName());
        project.setDescription(projectRequestDTO.getDescription());
        project.setColor(projectRequestDTO.getColor());
        project.setIconName(projectRequestDTO.getIconName());
        project.setFavorite(projectRequestDTO.isFavorite());
        
        Project updatedProject = projectRepository.save(project);
        return convertToDTO(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        User currentUser = userService.getCurrentAuthenticatedUserEntity();
        if (currentUser == null) {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực để xóa dự án.");
        }
        Project project = projectRepository.findByIdAndOwnerId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại hoặc bạn không có quyền xóa. ID: " + id));
        projectRepository.delete(project);
    }
    
    @PostConstruct
    @Transactional
    public void initDefaultProjectsForDevUser() {
        if (projectRepository.count() == 0 && StringUtils.hasText(defaultUserEmailForDevData)) {
            userRepository.findByEmail(defaultUserEmailForDevData).ifPresent(devUser -> {
                if (projectRepository.findByOwnerId(devUser.getId()).isEmpty()) {
                    List<Project> defaultProjects = Arrays.asList(
                        new Project(null, "Kế Hoạch Cá Nhân", "Các công việc và mục tiêu cá nhân", "bg-indigo-500", "User", true, devUser, new ArrayList<>(), null, null),
                        new Project(null, "Dự Án Công Ty ABC", "Phát triển module XYZ", "bg-sky-500", "Briefcase", false, devUser, new ArrayList<>(), null, null),
                        new Project(null, "Học Tập Mới", "Nghiên cứu công nghệ AI và ML", "bg-green-500", "BookOpen", true, devUser, new ArrayList<>(), null, null)
                    );
                    projectRepository.saveAll(defaultProjects);
                }
            });
        }
    }
}
