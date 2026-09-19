package com.erdtool.backend.controller;

import com.erdtool.backend.model.Project;
import com.erdtool.backend.model.ProjectCollaborator;
import com.erdtool.backend.model.User;
import com.erdtool.backend.repository.UserRepository;
import com.erdtool.backend.service.ProjectCollaboratorService;
import com.erdtool.backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;
    private final ProjectCollaboratorService collaboratorService;
    private final UserRepository userRepository;

    @PostMapping
    public Project create(@AuthenticationPrincipal UUID userId, @RequestBody Project project) {
        User owner = userRepository.getReferenceById(userId);
        project.setOwner(owner);
        Project created = projectService.create(project);

        ProjectCollaborator ownerAsCollaborator = new ProjectCollaborator();
        ownerAsCollaborator.setProject(created);
        ownerAsCollaborator.setUser(owner);
        ownerAsCollaborator.setRole(ProjectCollaborator.Role.OWNER);
        collaboratorService.add(ownerAsCollaborator);

        return created;
    }

    @PostMapping("/join")
    public Project join(@AuthenticationPrincipal UUID userId, @RequestParam String code) {
        Project project = projectService.findByInviteCode(code);
        User user = userRepository.getReferenceById(userId);

        ProjectCollaborator collaborator = new ProjectCollaborator();
        collaborator.setProject(project);
        collaborator.setUser(user);
        collaborator.setRole(ProjectCollaborator.Role.EDITOR);
        collaboratorService.add(collaborator);

        return project;
    }

    @GetMapping("/{id}")
    public Project findById(@PathVariable UUID id) {
        return projectService.findById(id);
    }

    @GetMapping("/mine")
    public List<Project> findMine(@AuthenticationPrincipal UUID userId) {
        return projectService.findAllForUser(userId);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable UUID id, @RequestBody Project changes) {
        return projectService.update(id, changes.getName(), changes.getDescription());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        projectService.delete(id);
    }
}