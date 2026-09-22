package com.erdtool.backend.service;

import com.erdtool.backend.model.DiagramRelationship;
import com.erdtool.backend.model.DiagramRelationship.AssociationType;
import com.erdtool.backend.model.DiagramRelationship.RelationshipType;
import com.erdtool.backend.repository.DiagramRelationshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

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
        validate(relationship);
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

        validate(relationship);
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
        if (type == AssociationType.GENERALIZATION) {
            checkNoInheritanceCycle(r);
        }
    }

    // Si el padre ya hereda (directa o indirectamente) del hijo, se formaría un ciclo
    private void checkNoInheritanceCycle(DiagramRelationship r) {
        List<DiagramRelationship> generalizations = relationshipRepository.findByProjectId(r.getProject().getId()).stream()
                .filter(g -> g.getAssociationType() == AssociationType.GENERALIZATION)
                .filter(g -> !Objects.equals(g.getId(), r.getId()))
                .toList();

        UUID child = r.getSourceEntity().getId();
        Deque<UUID> pending = new ArrayDeque<>();
        pending.push(r.getTargetEntity().getId());
        Set<UUID> visited = new HashSet<>();

        while (!pending.isEmpty()) {
            UUID current = pending.pop();
            if (current.equals(child)) {
                throw new RuntimeException("La generalización crearía un ciclo de herencia");
            }
            if (!visited.add(current)) continue;
            for (DiagramRelationship g : generalizations) {
                if (g.getSourceEntity().getId().equals(current)) {
                    pending.push(g.getTargetEntity().getId());
                }
            }
        }
    }

    // Deja cada relación con lo que su tipo tiene y sin lo que no tiene
    private void applyRules(DiagramRelationship r) {
        AssociationType type = r.getAssociationType();

        if (!type.allowsName()) {
            r.setName(null);
        }
        if (type == AssociationType.GENERALIZATION) {
            r.setRelationshipType(RelationshipType.ONE_TO_ONE);
        }
        if (!type.allowsCardinality()) {
            r.setSourceCardinality("");
            r.setTargetCardinality("");
            return;
        }

        // el "todo" de una composición es uno solo
        if (type == AssociationType.COMPOSITION
                && !List.of("1", "0..1").contains(r.getSourceCardinality())) {
            r.setSourceCardinality("1");
        }

        // el tipo (que usa el backend generado) sale de las cardinalidades, así nunca se contradicen
        boolean sourceMany = r.getSourceCardinality().contains("*");
        boolean targetMany = r.getTargetCardinality().contains("*");
        if (sourceMany && targetMany) {
            // en muchos a muchos no hay verbo ni cardinalidad: el nombre lo lleva la tabla intermedia
            r.setRelationshipType(RelationshipType.MANY_TO_MANY);
            r.setName(null);
            r.setSourceCardinality("*");
            r.setTargetCardinality("*");
        } else {
            r.setRelationshipType(sourceMany || targetMany ? RelationshipType.ONE_TO_MANY : RelationshipType.ONE_TO_ONE);
        }
    }
}