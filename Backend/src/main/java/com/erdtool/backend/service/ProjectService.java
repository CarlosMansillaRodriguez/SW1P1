package com.erdtool.backend.service;

import com.erdtool.backend.model.Project;
import com.erdtool.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();
    private final ProjectRepository projectRepository;

    public Project create(Project project) {
        project.setInviteCode(generateInviteCode());
        return projectRepository.save(project);
    }

    private String generateInviteCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
        }
        String code = sb.toString();
        return projectRepository.findByInviteCode(code).isPresent() ? generateInviteCode() : code;
    }

    public Project findById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado: " + id));
    }

    public Project findByInviteCode(String code) {
        return projectRepository.findByInviteCode(code)
                .orElseThrow(() -> new RuntimeException("Código de invitación inválido"));
    }

    public List<Project> findAllForUser(UUID userId) {
        return projectRepository.findAllForUser(userId);
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