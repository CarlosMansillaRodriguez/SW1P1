package com.erdtool.backend.service;

import com.erdtool.backend.model.DiagramRelationship;
import com.erdtool.backend.repository.DiagramRelationshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiagramRelationshipService {
    private final DiagramRelationshipRepository relationshipRepository;

    public DiagramRelationship create(DiagramRelationship relationship) {
        return relationshipRepository.save(relationship);
    }

    public List<DiagramRelationship> findByProject(UUID projectId) {
        return relationshipRepository.findByProjectId(projectId);
    }

    public void delete(UUID id) {
        relationshipRepository.deleteById(id);
    }
}