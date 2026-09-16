package com.erdtool.backend.service;

import com.erdtool.backend.model.Project;
import com.erdtool.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;

    public Project create(Project project) {
        return projectRepository.save(project);
    }

    public Project findById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado: " + id));
    }

    public List<Project> findByOwner(UUID ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    public Project update(UUID id, String name, String description) {
        Project project = findById(id);
        project.setName(name);
        project.setDescription(description);
        project.setUpdatedAt(LocalDateTime.now());
        return projectRepository.save(project);
    }

    public void delete(UUID id) {
        projectRepository.deleteById(id);
    }
}