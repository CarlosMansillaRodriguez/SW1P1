package com.erdtool.backend.service;

import com.erdtool.backend.model.DiagramAttribute;
import com.erdtool.backend.repository.DiagramAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiagramAttributeService {
    private final DiagramAttributeRepository attributeRepository;

    public DiagramAttribute create(DiagramAttribute attribute) {
        return attributeRepository.save(attribute);
    }

    public List<DiagramAttribute> findByEntity(UUID entityId) {
        return attributeRepository.findByEntityIdOrderByOrderIndex(entityId);
    }

    public DiagramAttribute update(UUID id, DiagramAttribute changes) {
        DiagramAttribute attribute = attributeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atributo no encontrado: " + id));
        attribute.setName(changes.getName());
        attribute.setDataType(changes.getDataType());
        attribute.setPrimaryKey(changes.isPrimaryKey());
        attribute.setForeignKey(changes.isForeignKey());
        attribute.setNullable(changes.isNullable());
        attribute.setUnique(changes.isUnique());
        attribute.setDefaultValue(changes.getDefaultValue());
        return attributeRepository.save(attribute);
    }

    public void delete(UUID id) {
        attributeRepository.deleteById(id);
    }
}