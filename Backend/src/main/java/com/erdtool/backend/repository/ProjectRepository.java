package com.erdtool.backend.repository;

import com.erdtool.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOwnerId(UUID ownerId);
    Optional<Project> findByInviteCode(String inviteCode);

    @Query("SELECT DISTINCT p FROM Project p JOIN ProjectCollaborator c ON c.project = p WHERE c.user.id = :userId")
    List<Project> findAllForUser(@Param("userId") UUID userId);
}