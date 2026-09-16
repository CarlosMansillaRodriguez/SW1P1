package com.erdtool.backend.controller;

import com.erdtool.backend.model.DiagramEntity;
import com.erdtool.backend.repository.ProjectRepository;
import com.erdtool.backend.service.DiagramEntityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DiagramEntityController {
    private final DiagramEntityService entityService;
    private final ProjectRepository projectRepository;

    @PostMapping("/projects/{projectId}/entities")
    public DiagramEntity create(@PathVariable UUID projectId, @RequestBody DiagramEntity entity) {
        entity.setProject(projectRepository.getReferenceById(projectId));
        return entityService.create(entity);
    }

    @GetMapping("/projects/{projectId}/entities")
    public List<DiagramEntity> findByProject(@PathVariable UUID projectId) {
        return entityService.findByProject(projectId);
    }

    @GetMapping("/entities/{id}")
    public DiagramEntity findById(@PathVariable UUID id) {
        return entityService.findById(id);
    }

    @PutMapping("/entities/{id}/rename")
    public DiagramEntity rename(@PathVariable UUID id, @RequestParam String name) {
        return entityService.rename(id, name);
    }

    @PutMapping("/entities/{id}/move")
    public DiagramEntity move(@PathVariable UUID id, @RequestParam Integer posX, @RequestParam Integer posY) {
        return entityService.move(id, posX, posY);
    }

    @DeleteMapping("/entities/{id}")
    public void delete(@PathVariable UUID id) {
        entityService.delete(id);
    }
}