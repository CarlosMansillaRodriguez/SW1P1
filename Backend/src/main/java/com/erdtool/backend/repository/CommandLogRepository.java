package com.erdtool.backend.repository;

import com.erdtool.backend.model.CommandLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface CommandLogRepository extends JpaRepository<CommandLog, UUID> {
    List<CommandLog> findByProjectIdOrderByAppliedAtAsc(UUID projectId);
}