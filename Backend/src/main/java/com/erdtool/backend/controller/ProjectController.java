package com.erdtool.backend.controller;

import com.erdtool.backend.model.Project;
import com.erdtool.backend.model.User;
import com.erdtool.backend.repository.UserRepository;
import com.erdtool.backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;
    private final UserRepository userRepository;

    @PostMapping
    public Project create(@RequestParam UUID ownerId, @RequestBody Project project) {
        User owner = userRepository.getReferenceById(ownerId);
        project.setOwner(owner);
        return projectService.create(project);
    }

    @GetMapping("/{id}")
    public Project findById(@PathVariable UUID id) {
        return projectService.findById(id);
    }

    @GetMapping("/owner/{ownerId}")
    public List<Project> findByOwner(@PathVariable UUID ownerId) {
        return projectService.findByOwner(ownerId);
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