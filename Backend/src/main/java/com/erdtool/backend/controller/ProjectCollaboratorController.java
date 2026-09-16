package com.erdtool.backend.controller;

import com.erdtool.backend.model.ProjectCollaborator;
import com.erdtool.backend.repository.ProjectRepository;
import com.erdtool.backend.repository.UserRepository;
import com.erdtool.backend.service.ProjectCollaboratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectCollaboratorController {
    private final ProjectCollaboratorService collaboratorService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @PostMapping("/projects/{projectId}/collaborators")
    public ProjectCollaborator add(@PathVariable UUID projectId,
                                    @RequestParam UUID userId,
                                    @RequestParam ProjectCollaborator.Role role) {
        ProjectCollaborator collaborator = new ProjectCollaborator();
        collaborator.setProject(projectRepository.getReferenceById(projectId));
        collaborator.setUser(userRepository.getReferenceById(userId));
        collaborator.setRole(role);
        return collaboratorService.add(collaborator);
    }

    @GetMapping("/projects/{projectId}/collaborators")
    public List<ProjectCollaborator> findByProject(@PathVariable UUID projectId) {
        return collaboratorService.findByProject(projectId);
    }

    @DeleteMapping("/collaborators/{id}")
    public void remove(@PathVariable UUID id) {
        collaboratorService.remove(id);
    }
}