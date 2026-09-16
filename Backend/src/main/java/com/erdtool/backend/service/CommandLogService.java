package com.erdtool.backend.service;

import com.erdtool.backend.model.CommandLog;
import com.erdtool.backend.repository.CommandLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommandLogService {
    private final CommandLogRepository commandLogRepository;

    public CommandLog log(CommandLog commandLog) {
        return commandLogRepository.save(commandLog);
    }

    public List<CommandLog> findByProject(UUID projectId) {
        return commandLogRepository.findByProjectIdOrderByAppliedAtAsc(projectId);
    }
}