package com.erdtool.backend.repository;

import com.erdtool.backend.model.DiagramRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface DiagramRelationshipRepository extends JpaRepository<DiagramRelationship, UUID> {
    List<DiagramRelationship> findByProjectId(UUID projectId);
}