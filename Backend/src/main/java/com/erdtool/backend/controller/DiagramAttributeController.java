package com.erdtool.backend.controller;

import com.erdtool.backend.model.DiagramAttribute;
import com.erdtool.backend.repository.DiagramEntityRepository;
import com.erdtool.backend.service.DiagramAttributeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DiagramAttributeController {
    private final DiagramAttributeService attributeService;
    private final DiagramEntityRepository entityRepository;

    @PostMapping("/entities/{entityId}/attributes")
    public DiagramAttribute create(@PathVariable UUID entityId, @RequestBody DiagramAttribute attribute) {
        attribute.setEntity(entityRepository.getReferenceById(entityId));
        return attributeService.create(attribute);
    }

    @GetMapping("/entities/{entityId}/attributes")
    public List<DiagramAttribute> findByEntity(@PathVariable UUID entityId) {
        return attributeService.findByEntity(entityId);
    }

    @PutMapping("/attributes/{id}")
    public DiagramAttribute update(@PathVariable UUID id, @RequestBody DiagramAttribute changes) {
        return attributeService.update(id, changes);
    }

    @DeleteMapping("/attributes/{id}")
    public void delete(@PathVariable UUID id) {
        attributeService.delete(id);
    }

    @PutMapping("/entities/{entityId}/attributes/reorder")
public void reorder(@PathVariable UUID entityId, @RequestBody List<UUID> orderedIds) {
    attributeService.reorder(entityId, orderedIds);
}
}