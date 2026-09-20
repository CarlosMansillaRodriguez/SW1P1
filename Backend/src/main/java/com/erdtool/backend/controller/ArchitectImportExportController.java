package com.erdtool.backend.controller;

import com.erdtool.backend.io.ArchitectXmlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ArchitectImportExportController {
    private final ArchitectXmlService architectXmlService;

    @GetMapping("/projects/{projectId}/export/architect")
    public ResponseEntity<byte[]> export(@PathVariable UUID projectId) throws Exception {
        byte[] xml = architectXmlService.export(projectId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("diagrama.architect").build());
        headers.setContentType(MediaType.APPLICATION_XML);

        return ResponseEntity.ok().headers(headers).body(xml);
    }

    @PostMapping("/projects/{projectId}/import/architect")
    public ResponseEntity<Void> importArchitect(@PathVariable UUID projectId,
                                                 @RequestParam("file") MultipartFile file) throws Exception {
        architectXmlService.importInto(projectId, file.getInputStream());
        return ResponseEntity.ok().build();
    }
}