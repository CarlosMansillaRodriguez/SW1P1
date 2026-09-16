package com.erdtool.backend.service;

import com.erdtool.backend.model.DiagramEntity;
import com.erdtool.backend.repository.DiagramEntityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiagramEntityService {
    private final DiagramEntityRepository entityRepository;

    public DiagramEntity create(DiagramEntity entity) {
        return entityRepository.save(entity);
    }

    public DiagramEntity findById(UUID id) {
        return entityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entidad no encontrada: " + id));
    }

    public List<DiagramEntity> findByProject(UUID projectId) {
        return entityRepository.findByProjectId(projectId);
    }

    public DiagramEntity rename(UUID id, String newName) {
        DiagramEntity entity = findById(id);
        entity.setName(newName);
        entity.setUpdatedAt(LocalDateTime.now());
        return entityRepository.save(entity);
    }

    public DiagramEntity move(UUID id, Integer posX, Integer posY) {
        DiagramEntity entity = findById(id);
        entity.setPosX(posX);
        entity.setPosY(posY);
        entity.setUpdatedAt(LocalDateTime.now());
        return entityRepository.save(entity);
    }

    public void delete(UUID id) {
        entityRepository.deleteById(id);
    }
}