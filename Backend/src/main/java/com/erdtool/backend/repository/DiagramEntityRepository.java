package com.erdtool.backend.repository;

import com.erdtool.backend.model.DiagramEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface DiagramEntityRepository extends JpaRepository<DiagramEntity, UUID> {
    List<DiagramEntity> findByProjectId(UUID projectId);
}