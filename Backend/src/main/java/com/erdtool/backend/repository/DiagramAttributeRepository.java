package com.erdtool.backend.repository;

import com.erdtool.backend.model.DiagramAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface DiagramAttributeRepository extends JpaRepository<DiagramAttribute, UUID> {
    List<DiagramAttribute> findByEntityIdOrderByOrderIndex(UUID entityId);
}