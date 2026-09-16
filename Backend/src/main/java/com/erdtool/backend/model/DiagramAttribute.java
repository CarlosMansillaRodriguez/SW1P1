package com.erdtool.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Entity
@Table(name = "attributes")
@Getter @Setter
public class DiagramAttribute {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "entity_id", nullable = false)
    private DiagramEntity entity;

    @Column(nullable = false)
    private String name;

    @Column(name = "data_type", nullable = false)
    private String dataType;

    @Column(name = "is_primary_key")
    private boolean primaryKey = false;

    @Column(name = "is_foreign_key")
    private boolean foreignKey = false;

    @Column(name = "is_nullable")
    private boolean nullable = true;

    @Column(name = "is_unique")
    private boolean unique = false;

    @Column(name = "default_value")
    private String defaultValue;

    @Column(name = "order_index")
    private Integer orderIndex = 0;
}