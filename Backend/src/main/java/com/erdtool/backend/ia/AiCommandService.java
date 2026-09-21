package com.erdtool.backend.ia;

import com.erdtool.backend.model.*;
import com.erdtool.backend.repository.*;
import com.erdtool.backend.service.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiCommandService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DiagramEntityRepository entityRepository;
    private final DiagramAttributeRepository attributeRepository;
    private final DiagramRelationshipRepository relationshipRepository;
    private final DiagramEntityService entityService;
    private final DiagramAttributeService attributeService;
    private final DiagramRelationshipService relationshipService;
    private final CommandLogService commandLogService;

    public AiCommandResult execute(UUID projectId, UUID userId, String userText, String source) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado: " + projectId));

        List<DiagramEntity> entities = entityRepository.findByProjectId(projectId);
        String contextJson = buildContextJson(entities);
        String prompt = buildPrompt(contextJson, userText);
        String rawJson = geminiClient.generateJson(prompt);

        JsonNode parsed;
        try {
            parsed = objectMapper.readTree(rawJson);
        } catch (Exception e) {
            throw new RuntimeException("La IA no devolvió JSON válido: " + rawJson, e);
        }

        AiCommandResult result = new AiCommandResult();
        result.setReply(parsed.path("reply").asText("Listo."));

        Map<String, DiagramEntity> byName = new HashMap<>();
        for (DiagramEntity e : entities) byName.put(normalize(e.getName()), e);

        boolean relationshipsChanged = false;
        JsonNode actions = parsed.path("actions");

        if (actions.isArray()) {
            for (JsonNode action : actions) {
                String type = action.path("action").asText("");
                try {
                    switch (type) {
                        case "create_table" -> {
                            DiagramEntity entity = new DiagramEntity();
                            entity.setProject(project);
                            entity.setName(action.path("name").asText("Tabla"));
                            entity.setPosX(100 + (int) (Math.random() * 300));
                            entity.setPosY(100 + (int) (Math.random() * 300));
                            entity = entityService.create(entity);
                            byName.put(normalize(entity.getName()), entity);
                            result.getAffectedEntityIds().add(entity.getId());
                        }
                        case "rename_table" -> {
                            DiagramEntity entity = byName.get(normalize(action.path("table").asText("")));
                            if (entity != null) {
                                entity = entityService.rename(entity.getId(), action.path("newName").asText(entity.getName()));
                                byName.put(normalize(entity.getName()), entity);
                                result.getAffectedEntityIds().add(entity.getId());
                            }
                        }
                        case "delete_table" -> {
                            DiagramEntity entity = byName.get(normalize(action.path("table").asText("")));
                            if (entity != null) {
                                entityService.delete(entity.getId());
                                result.getDeletedEntityIds().add(entity.getId());
                                relationshipsChanged = true;
                            }
                        }
                        case "add_attribute" -> {
                            DiagramEntity entity = byName.get(normalize(action.path("table").asText("")));
                            if (entity != null) {
                                DiagramAttribute attr = new DiagramAttribute();
                                attr.setEntity(entity);
                                attr.setName(action.path("name").asText("campo"));
                                attr.setDataType(action.path("dataType").asText("VARCHAR"));
                                attr.setPrimaryKey(action.path("primaryKey").asBoolean(false));
                                attr.setForeignKey(action.path("foreignKey").asBoolean(false));
                                attr.setNullable(action.path("nullable").asBoolean(true));
                                attr.setUnique(action.path("unique").asBoolean(false));
                                attributeService.create(attr);
                                result.getAffectedEntityIds().add(entity.getId());
                            }
                        }
                        case "delete_attribute" -> {
                            DiagramEntity entity = byName.get(normalize(action.path("table").asText("")));
                            if (entity != null) {
                                String attrName = normalize(action.path("name").asText(""));
                                attributeRepository.findByEntityIdOrderByOrderIndex(entity.getId()).stream()
                                        .filter(a -> normalize(a.getName()).equals(attrName))
                                        .findFirst()
                                        .ifPresent(a -> attributeService.delete(a.getId()));
                                result.getAffectedEntityIds().add(entity.getId());
                            }
                        }
                        case "create_relationship" -> {
                            DiagramEntity sourceE = byName.get(normalize(action.path("sourceTable").asText("")));
                            DiagramEntity target = byName.get(normalize(action.path("targetTable").asText("")));
                            if (source != null && target != null) {
                                DiagramRelationship rel = new DiagramRelationship();
                                rel.setProject(project);
                                rel.setSourceEntity(sourceE);
                                rel.setTargetEntity(target);
                                rel.setName(action.path("verb").asText(null));
                                rel.setRelationshipType(parseEnumSafe(DiagramRelationship.RelationshipType.class,
                                        action.path("type").asText(""), DiagramRelationship.RelationshipType.ONE_TO_MANY));
                                rel.setAssociationType(parseEnumSafe(DiagramRelationship.AssociationType.class,
                                        action.path("associationType").asText(""), DiagramRelationship.AssociationType.ASSOCIATION));
                                rel.setSourceCardinality(action.path("sourceCardinality").asText("1"));
                                rel.setTargetCardinality(action.path("targetCardinality").asText("*"));
                                relationshipService.create(rel);
                                relationshipsChanged = true;
                            }
                        }
                        case "delete_relationship" -> {
                            DiagramEntity sourceR = byName.get(normalize(action.path("sourceTable").asText("")));
                            DiagramEntity target = byName.get(normalize(action.path("targetTable").asText("")));
                            if (source != null && target != null) {
                                relationshipRepository.findByProjectId(projectId).stream()
                                        .filter(r -> r.getSourceEntity().getId().equals(sourceR.getId())
                                                && r.getTargetEntity().getId().equals(target.getId()))
                                        .findFirst()
                                        .ifPresent(r -> relationshipService.delete(r.getId()));
                                relationshipsChanged = true;
                            }
                        }
                        default -> { /* acción desconocida, se ignora */ }
                    }
                } catch (Exception ignoredActionError) {
                    // una acción individual fallida no debe tumbar el resto del comando
                }
            }
        }

        result.setRelationshipsChanged(relationshipsChanged);

        CommandLog log = new CommandLog();
        log.setProject(project);
        log.setUser(userRepository.getReferenceById(userId));
        log.setSource(CommandLog.Source.valueOf(source));
        log.setRawInput(userText);
        log.setParsedCommand(rawJson);
        log.setSuccess(true);
        commandLogService.log(log);

        return result;
    }

    private String buildContextJson(List<DiagramEntity> entities) {
        List<Map<String, Object>> tables = new ArrayList<>();
        for (DiagramEntity e : entities) {
            List<DiagramAttribute> attrs = attributeRepository.findByEntityIdOrderByOrderIndex(e.getId());
            List<Map<String, Object>> attrList = new ArrayList<>();
            for (DiagramAttribute a : attrs) {
                attrList.add(Map.of("name", a.getName(), "dataType", a.getDataType(), "primaryKey", a.isPrimaryKey()));
            }
            tables.add(Map.of("name", e.getName(), "attributes", attrList));
        }
        try {
            return objectMapper.writeValueAsString(tables);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String buildPrompt(String contextJson, String userText) {
        return """
                Sos un asistente que edita un modelo entidad-relación de una base de datos.
                Estado actual de las tablas (JSON): %s

                Instrucción del usuario: "%s"

                Respondé ÚNICAMENTE con un JSON con esta forma exacta, sin texto adicional ni markdown:
                {
                  "reply": "una frase corta en español confirmando qué hiciste",
                  "actions": [
                    { "action": "create_table", "name": "..." },
                    { "action": "rename_table", "table": "...", "newName": "..." },
                    { "action": "delete_table", "table": "..." },
                    { "action": "add_attribute", "table": "...", "name": "...", "dataType": "VARCHAR|TEXT|INTEGER|BOOLEAN|DATE|TIMESTAMP|DECIMAL|UUID", "primaryKey": false, "foreignKey": false, "nullable": true, "unique": false },
                    { "action": "delete_attribute", "table": "...", "name": "..." },
                    { "action": "create_relationship", "sourceTable": "...", "targetTable": "...", "type": "ONE_TO_ONE|ONE_TO_MANY|MANY_TO_MANY", 
                     "associationType": "ASSOCIATION|DIRECTED_ASSOCIATION|GENERALIZATION|AGGREGATION|COMPOSITION|DEPENDENCY|REALIZATION": "ASSOCIATION|GENERALIZATION|AGGREGATION|COMPOSITION", "sourceCardinality": "1|0..1|*|0..*|1..*", "targetCardinality": "1|0..1|*|0..*|1..*", "verb": "..." },
                    { "action": "delete_relationship", "sourceTable": "...", "targetTable": "..." }
                  ]
                }
                Usá los nombres de tabla EXACTOS que aparecen en el estado actual cuando la instrucción se refiera a una tabla existente.
                Reglas: en GENERALIZATION y REALIZATION no hay verbo ni cardinalidades, sourceTable es el hijo (o la implementación) y targetTable el padre (o la interfaz).
                En DEPENDENCY no hay cardinalidades. En AGGREGATION y COMPOSITION sourceTable es el "todo" y targetTable la "parte"; en COMPOSITION sourceCardinality solo puede ser 1 o 0..1.
                Si la instrucción no requiere cambios (es una pregunta), dejá "actions" como una lista vacía y respondé la pregunta en "reply".
                """.formatted(contextJson, userText);
    }

    private String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    private <T extends Enum<T>> T parseEnumSafe(Class<T> enumClass, String value, T fallback) {
        try {
            return Enum.valueOf(enumClass, value);
        } catch (Exception e) {
            return fallback;
        }
    }
}