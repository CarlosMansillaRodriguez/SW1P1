package com.erdtool.backend.service;

import com.erdtool.backend.model.DiagramRelationship;
import com.erdtool.backend.model.DiagramRelationship.AssociationType;
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
        validate(relationship);
        applyRules(relationship);
        return relationshipRepository.save(relationship);
    }

    public DiagramRelationship findById(UUID id) {
        return relationshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Relación no encontrada: " + id));
    }

    public List<DiagramRelationship> findByProject(UUID projectId) {
        return relationshipRepository.findByProjectId(projectId);
    }

    public DiagramRelationship update(UUID id, DiagramRelationship changes) {
        DiagramRelationship relationship = findById(id);
        relationship.setName(changes.getName());
        relationship.setRelationshipType(changes.getRelationshipType());
        relationship.setAssociationType(changes.getAssociationType());
        relationship.setSourceCardinality(changes.getSourceCardinality());
        relationship.setTargetCardinality(changes.getTargetCardinality());
        applyRules(relationship);
        return relationshipRepository.save(relationship);
    }

    public void delete(UUID id) {
        relationshipRepository.deleteById(id);
    }

    public DiagramRelationship swapDirection(UUID id) {
        DiagramRelationship relationship = findById(id);

        var tempEntity = relationship.getSourceEntity();
        relationship.setSourceEntity(relationship.getTargetEntity());
        relationship.setTargetEntity(tempEntity);

        String tempCardinality = relationship.getSourceCardinality();
        relationship.setSourceCardinality(relationship.getTargetCardinality());
        relationship.setTargetCardinality(tempCardinality);

        applyRules(relationship);
        return relationshipRepository.save(relationship);
    }

    private void validate(DiagramRelationship r) {
        AssociationType type = r.getAssociationType();
        boolean sameEntity = r.getSourceEntity().getId().equals(r.getTargetEntity().getId());
        if (sameEntity && (type == AssociationType.GENERALIZATION || type == AssociationType.REALIZATION)) {
            throw new RuntimeException("Una generalización o realización no puede unir una tabla consigo misma");
        }
        if (type == AssociationType.ASSOCIATION_CLASS && r.getTargetRelationship() == null) {
            throw new RuntimeException("La clase de asociación debe estar colgada de una asociación");
        }
    }

    // Deja cada relación con lo que su tipo tiene y sin lo que no tiene
    private void applyRules(DiagramRelationship r) {
        AssociationType type = r.getAssociationType();
        if (!type.allowsName()) {
            r.setName(null);
        }
        if (!type.allowsCardinality()) {
            r.setSourceCardinality("");
            r.setTargetCardinality("");
        } else if (type == AssociationType.COMPOSITION
                && !List.of("1", "0..1").contains(r.getSourceCardinality())) {
            r.setSourceCardinality("1");
        }
    }
}