package com.erdtool.backend.controller;

import com.erdtool.backend.generator.backendGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class backendGeneratorController {
    private final backendGeneratorService generatorService;

    @GetMapping("/projects/{projectId}/generate-backend")
    public ResponseEntity<byte[]> generate(@PathVariable UUID projectId) throws IOException {
        byte[] zip = generatorService.generate(projectId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("backend-generado.zip").build());
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok().headers(headers).body(zip);
    }
}