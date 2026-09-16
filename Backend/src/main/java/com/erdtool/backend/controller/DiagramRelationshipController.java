package com.erdtool.backend.controller;

import com.erdtool.backend.model.DiagramRelationship;
import com.erdtool.backend.repository.DiagramEntityRepository;
import com.erdtool.backend.repository.ProjectRepository;
import com.erdtool.backend.service.DiagramRelationshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DiagramRelationshipController {
    private final DiagramRelationshipService relationshipService;
    private final ProjectRepository projectRepository;
    private final DiagramEntityRepository entityRepository;

    @PostMapping("/projects/{projectId}/relationships")
    public DiagramRelationship create(@PathVariable UUID projectId,
                                       @RequestParam UUID sourceEntityId,
                                       @RequestParam UUID targetEntityId,
                                       @RequestBody DiagramRelationship relationship) {
        relationship.setProject(projectRepository.getReferenceById(projectId));
        relationship.setSourceEntity(entityRepository.getReferenceById(sourceEntityId));
        relationship.setTargetEntity(entityRepository.getReferenceById(targetEntityId));
        return relationshipService.create(relationship);
    }

    @GetMapping("/projects/{projectId}/relationships")
    public List<DiagramRelationship> findByProject(@PathVariable UUID projectId) {
        return relationshipService.findByProject(projectId);
    }

    @DeleteMapping("/relationships/{id}")
    public void delete(@PathVariable UUID id) {
        relationshipService.delete(id);
    }
}