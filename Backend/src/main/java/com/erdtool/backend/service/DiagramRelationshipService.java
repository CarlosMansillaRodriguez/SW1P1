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

    public DiagramRelationship update(UUID id, DiagramRelationship changes) {
        DiagramRelationship relationship = relationshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Relación no encontrada: " + id));
        relationship.setName(changes.getName());
        relationship.setRelationshipType(changes.getRelationshipType());
        relationship.setAssociationType(changes.getAssociationType());
        relationship.setSourceCardinality(changes.getSourceCardinality());
        relationship.setTargetCardinality(changes.getTargetCardinality());
        return relationshipRepository.save(relationship);
    }

    public void delete(UUID id) {
        relationshipRepository.deleteById(id);
    }
}