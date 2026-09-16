package com.erdtool.backend.repository;

import com.erdtool.backend.model.ProjectCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface ProjectCollaboratorRepository extends JpaRepository<ProjectCollaborator, UUID> {
    List<ProjectCollaborator> findByProjectId(UUID projectId);
}