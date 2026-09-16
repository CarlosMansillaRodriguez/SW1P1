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

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_type", nullable = false)
    private RelationshipType relationshipType;

    public enum RelationshipType { ONE_TO_ONE, ONE_TO_MANY, MANY_TO_MANY }
}