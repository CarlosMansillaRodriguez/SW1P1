package com.erdtool.backend.service;

import com.erdtool.backend.model.ProjectCollaborator;
import com.erdtool.backend.repository.ProjectCollaboratorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectCollaboratorService {
    private final ProjectCollaboratorRepository collaboratorRepository;

    public ProjectCollaborator add(ProjectCollaborator collaborator) {
        return collaboratorRepository.save(collaborator);
    }

    public List<ProjectCollaborator> findByProject(UUID projectId) {
        return collaboratorRepository.findByProjectId(projectId);
    }

    public void remove(UUID id) {
        collaboratorRepository.deleteById(id);
    }
}