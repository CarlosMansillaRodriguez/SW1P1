package com.erdtool.backend.ia;

import com.erdtool.backend.model.*;
import com.erdtool.backend.repository.ProjectRepository;
import com.erdtool.backend.service.DiagramAttributeService;
import com.erdtool.backend.service.DiagramEntityService;
import com.erdtool.backend.service.DiagramRelationshipService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiImageImportService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ProjectRepository projectRepository;
    private final DiagramEntityService entityService;
    private final DiagramAttributeService attributeService;
    private final DiagramRelationshipService relationshipService;

    public AiCommandResult importFromImage(UUID projectId, MultipartFile file) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado: " + projectId));

        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

        String prompt = """
                Analizá esta imagen de un diagrama entidad-relación (o diagrama de clases) dibujado a mano o generado por otra herramienta.
                Extraé todas las tablas/entidades, sus atributos, y las relaciones entre ellas.

                Respondé ÚNICAMENTE con un JSON con esta forma exacta, sin texto adicional ni markdown:
                {
                  "entities": [
                    {
                      "name": "...",
                      "attributes": [
                        { "name": "...", "dataType": "VARCHAR|TEXT|INTEGER|BOOLEAN|DATE|TIMESTAMP|DECIMAL|UUID", "primaryKey": false, "foreignKey": false, "nullable": true, "unique": false }
                      ]
                    }
                  ],
                  "relationships": [
                    { "sourceTable": "...", "targetTable": "...", "type": "ONE_TO_ONE|ONE_TO_MANY|MANY_TO_MANY", "associationType": "ASSOCIATION|GENERALIZATION|AGGREGATION|COMPOSITION", "sourceCardinality": "1|0..1|*|0..*|1..*", "targetCardinality": "1|0..1|*|0..*|1..*", "verb": "..." }
                  ]
                }
                Si no podés identificar el tipo de dato de una columna, usá "VARCHAR". Si no podés determinar cuál es la clave primaria, asumí que es "id".
                """;

        String rawJson = geminiClient.generateJson(prompt, base64, mimeType);
        JsonNode parsed = objectMapper.readTree(rawJson);

        AiCommandResult result = new AiCommandResult();
        result.setReply("Diagrama importado desde la imagen.");

        Map<String, DiagramEntity> byName = new HashMap<>();
        JsonNode entities = parsed.path("entities");
        if (entities.isArray()) {
            int i = 0;
            for (JsonNode e : entities) {
                DiagramEntity entity = new DiagramEntity();
                entity.setProject(project);
                entity.setName(e.path("name").asText("Tabla" + i));
                entity.setPosX(100 + (i % 4) * 260);
                entity.setPosY(100 + (i / 4) * 220);
                entity = entityService.create(entity);
                byName.put(entity.getName().trim().toLowerCase(), entity);
                result.getAffectedEntityIds().add(entity.getId());

                JsonNode attrs = e.path("attributes");
                if (attrs.isArray()) {
                    for (JsonNode a : attrs) {
                        DiagramAttribute attr = new DiagramAttribute();
                        attr.setEntity(entity);
                        attr.setName(a.path("name").asText("campo"));
                        attr.setDataType(a.path("dataType").asText("VARCHAR"));
                        attr.setPrimaryKey(a.path("primaryKey").asBoolean(false));
                        attr.setForeignKey(a.path("foreignKey").asBoolean(false));
                        attr.setNullable(a.path("nullable").asBoolean(true));
                        attr.setUnique(a.path("unique").asBoolean(false));
                        attributeService.create(attr);
                    }
                }
                i++;
            }
        }

        JsonNode relationships = parsed.path("relationships");
        if (relationships.isArray()) {
            for (JsonNode r : relationships) {
                DiagramEntity source = byName.get(r.path("sourceTable").asText("").trim().toLowerCase());
                DiagramEntity target = byName.get(r.path("targetTable").asText("").trim().toLowerCase());
                if (source == null || target == null) continue;

                DiagramRelationship rel = new DiagramRelationship();
                rel.setProject(project);
                rel.setSourceEntity(source);
                rel.setTargetEntity(target);
                rel.setName(r.path("verb").asText(null));
                rel.setRelationshipType(parseEnumSafe(DiagramRelationship.RelationshipType.class,
                        r.path("type").asText(""), DiagramRelationship.RelationshipType.ONE_TO_MANY));
                rel.setAssociationType(parseEnumSafe(DiagramRelationship.AssociationType.class,
                        r.path("associationType").asText(""), DiagramRelationship.AssociationType.ASSOCIATION));
                rel.setSourceCardinality(r.path("sourceCardinality").asText("1"));
                rel.setTargetCardinality(r.path("targetCardinality").asText("*"));
                relationshipService.create(rel);
            }
            result.setRelationshipsChanged(true);
        }

        return result;
    }

    private <T extends Enum<T>> T parseEnumSafe(Class<T> enumClass, String value, T fallback) {
        try {
            return Enum.valueOf(enumClass, value);
        } catch (Exception e) {
            return fallback;
        }
    }
}