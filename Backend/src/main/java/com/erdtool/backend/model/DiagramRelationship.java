package com.erdtool.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Entity
@Table(name = "relationships")
@Getter @Setter
public class DiagramRelationship {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    private String name;

    @ManyToOne
    @JoinColumn(name = "source_entity_id", nullable = false)
    private DiagramEntity sourceEntity;

    @ManyToOne
    @JoinColumn(name = "target_entity_id", nullable = false)
    private DiagramEntity targetEntity;

    // Solo para la clase de asociación: la relación (asociación) a la que está colgada
    @ManyToOne
    @JoinColumn(name = "target_relationship_id")
    private DiagramRelationship targetRelationship;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_type", nullable = false)
    private RelationshipType relationshipType;

    @Enumerated(EnumType.STRING)
    @Column(name = "association_type", nullable = false)
    private AssociationType associationType = AssociationType.ASSOCIATION;

    @Column(name = "source_cardinality", nullable = false)
    private String sourceCardinality = "1";

    @Column(name = "target_cardinality", nullable = false)
    private String targetCardinality = "*";

    public enum RelationshipType { ONE_TO_ONE, ONE_TO_MANY, MANY_TO_MANY }

    public enum AssociationType {
        //                        verbo  cardinalidad  genera columnas en el backend
        ASSOCIATION(true, true, true),
        DIRECTED_ASSOCIATION(true, true, true),
        GENERALIZATION(false, false, true),
        AGGREGATION(true, true, true),
        COMPOSITION(true, true, true),
        DEPENDENCY(true, false, false),
        REALIZATION(false, false, false),
        ASSOCIATION_CLASS(false, false, false);

        private final boolean allowsName;
        private final boolean allowsCardinality;
        private final boolean persists;

        AssociationType(boolean allowsName, boolean allowsCardinality, boolean persists) {
            this.allowsName = allowsName;
            this.allowsCardinality = allowsCardinality;
            this.persists = persists;
        }

        public boolean allowsName() { return allowsName; }
        public boolean allowsCardinality() { return allowsCardinality; }
        public boolean persists() { return persists; }
    }
}