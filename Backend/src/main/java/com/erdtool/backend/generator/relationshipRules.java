package com.erdtool.backend.generator;

import com.erdtool.backend.model.DiagramEntity;
import com.erdtool.backend.model.DiagramRelationship;

public class relationshipRules {

    public static boolean generatesForeignKey(DiagramRelationship rel) {
        return rel.getAssociationType().persists()
                && rel.getRelationshipType() != DiagramRelationship.RelationshipType.MANY_TO_MANY;
    }

    public static boolean generatesJoinTable(DiagramRelationship rel) {
        return rel.getAssociationType().persists()
                && rel.getRelationshipType() == DiagramRelationship.RelationshipType.MANY_TO_MANY;
    }

    // En la herencia la FK va en el hijo (origen); en el resto, en el lado "muchos" (destino)
    public static DiagramEntity foreignKeyOwner(DiagramRelationship rel) {
        return isInheritance(rel) ? rel.getSourceEntity() : rel.getTargetEntity();
    }

    public static DiagramEntity referencedEntity(DiagramRelationship rel) {
        return isInheritance(rel) ? rel.getTargetEntity() : rel.getSourceEntity();
    }

    private static boolean isInheritance(DiagramRelationship rel) {
        return rel.getAssociationType() == DiagramRelationship.AssociationType.GENERALIZATION;
    }
}