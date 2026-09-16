package com.erdtool.backend.controller;

import com.erdtool.backend.model.CommandLog;
import com.erdtool.backend.repository.ProjectRepository;
import com.erdtool.backend.repository.UserRepository;
import com.erdtool.backend.service.CommandLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommandLogController {
    private final CommandLogService commandLogService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @PostMapping("/projects/{projectId}/command-logs")
    public CommandLog log(@PathVariable UUID projectId,
                           @RequestParam UUID userId,
                           @RequestBody CommandLog commandLog) {
        commandLog.setProject(projectRepository.getReferenceById(projectId));
        commandLog.setUser(userRepository.getReferenceById(userId));
        return commandLogService.log(commandLog);
    }

    @GetMapping("/projects/{projectId}/command-logs")
    public List<CommandLog> findByProject(@PathVariable UUID projectId) {
        return commandLogService.findByProject(projectId);
    }
}