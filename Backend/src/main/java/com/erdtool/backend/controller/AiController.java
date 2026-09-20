package com.erdtool.backend.controller;

import com.erdtool.backend.ia.AiCommandResult;
import com.erdtool.backend.ia.AiCommandService;
import com.erdtool.backend.ia.AiImageImportService;
import com.erdtool.backend.dto.AiCommandRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AiController {
    private final AiCommandService aiCommandService;
    private final AiImageImportService aiImageImportService;

    @PostMapping("/projects/{projectId}/ai/command")
    public AiCommandResult command(@PathVariable UUID projectId,
                                    @AuthenticationPrincipal UUID userId,
                                    @RequestBody AiCommandRequest request) {
        return aiCommandService.execute(projectId, userId, request.text(), request.source());
    }

    @PostMapping("/projects/{projectId}/ai/import-image")
    public AiCommandResult importImage(@PathVariable UUID projectId,
                                        @RequestParam("file") MultipartFile file) throws Exception {
        return aiImageImportService.importFromImage(projectId, file);
    }
}