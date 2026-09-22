package com.erdtool.backend.generator;

import com.erdtool.backend.model.DiagramEntity;
import com.erdtool.backend.model.DiagramRelationship;
import com.erdtool.backend.model.DiagramRelationship.AssociationType;
import com.erdtool.backend.model.DiagramRelationship.RelationshipType;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class relationshipRules {

    // owner = tabla que lleva la columna; referenced = tabla a la que apunta
    public record ForeignKey(DiagramEntity owner, DiagramEntity referenced, boolean unique) {}

    public static List<ForeignKey> foreignKeys(DiagramRelationship rel) {
        AssociationType type = rel.getAssociationType();
        if (!type.persists()) return List.of();

        // herencia: el hijo (origen) apunta al padre (destino)
        if (type == AssociationType.GENERALIZATION) {
            return List.of(new ForeignKey(rel.getSourceEntity(), rel.getTargetEntity(), true));
        }

        // la clase de asociación es la tabla intermedia: apunta a las dos tablas de la asociación
        if (type == AssociationType.ASSOCIATION_CLASS) {
            DiagramRelationship host = rel.getTargetRelationship();
            return List.of(
                    new ForeignKey(rel.getSourceEntity(), host.getSourceEntity(), false),
                    new ForeignKey(rel.getSourceEntity(), host.getTargetEntity(), false));
        }

        if (rel.getRelationshipType() == RelationshipType.MANY_TO_MANY) return List.of();

        // la FK va en el lado "muchos"
        boolean sourceMany = rel.getSourceCardinality().contains("*");
        boolean targetMany = rel.getTargetCardinality().contains("*");
        boolean unique = rel.getRelationshipType() == RelationshipType.ONE_TO_ONE;
        if (sourceMany && !targetMany) {
            return List.of(new ForeignKey(rel.getSourceEntity(), rel.getTargetEntity(), unique));
        }
        return List.of(new ForeignKey(rel.getTargetEntity(), rel.getSourceEntity(), unique));
    }

    // asociaciones que ya tienen su tabla intermedia (clase de asociación)
    public static Set<UUID> hostsWithClass(List<DiagramRelationship> relationships) {
        Set<UUID> hosts = new HashSet<>();
        for (DiagramRelationship rel : relationships) {
            if (rel.getAssociationType() == AssociationType.ASSOCIATION_CLASS && rel.getTargetRelationship() != null) {
                hosts.add(rel.getTargetRelationship().getId());
            }
        }
        return hosts;
    }

    // tabla de unión automática: solo para muchos a muchos que NO tienen clase intermedia
    public static boolean generatesJoinTable(DiagramRelationship rel, Set<UUID> hostsWithClass) {
        AssociationType type = rel.getAssociationType();
        boolean isAssociation = type == AssociationType.ASSOCIATION
                || type == AssociationType.DIRECTED_ASSOCIATION
                || type == AssociationType.AGGREGATION
                || type == AssociationType.COMPOSITION;
        return isAssociation
                && rel.getRelationshipType() == RelationshipType.MANY_TO_MANY
                && !hostsWithClass.contains(rel.getId());
    }
}