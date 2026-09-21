package com.erdtool.backend.generator;

import com.erdtool.backend.model.DiagramAttribute;
import com.erdtool.backend.model.DiagramEntity;
import com.erdtool.backend.model.DiagramRelationship;
import com.erdtool.backend.repository.DiagramAttributeRepository;
import com.erdtool.backend.repository.DiagramEntityRepository;
import com.erdtool.backend.repository.DiagramRelationshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class backendGeneratorService {

    private static final String BASE_PACKAGE = "com.generated.backend";

    private final DiagramEntityRepository entityRepository;
    private final DiagramAttributeRepository attributeRepository;
    private final DiagramRelationshipRepository relationshipRepository;

    private String loadTemplate(String name) throws IOException {
        try (var in = getClass().getResourceAsStream("/generator-templates/" + name)) {
            if (in == null)
                throw new IOException("No se encontró la plantilla: " + name);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public byte[] generate(UUID projectId) throws IOException {
        List<DiagramEntity> entities = entityRepository.findByProjectId(projectId);
        List<DiagramRelationship> relationships = relationshipRepository.findByProjectId(projectId);

        Map<UUID, List<DiagramAttribute>> attributesByEntity = new HashMap<>();
        Map<UUID, String> classNameByEntityId = new HashMap<>();
        Map<UUID, String> tableNameByEntityId = new HashMap<>();

        for (DiagramEntity entity : entities) {
            attributesByEntity.put(entity.getId(), attributeRepository.findByEntityIdOrderByOrderIndex(entity.getId()));
            classNameByEntityId.put(entity.getId(), nameUtils.toClassName(entity.getName()));
            tableNameByEntityId.put(entity.getId(), nameUtils.toTableName(entity.getName()));
        }

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(buffer)) {
            writeEntry(zip, "generated-backend/pom.xml", buildPomXml());
            writeEntry(zip, "generated-backend/src/main/resources/application.yml", buildApplicationYml());
            writeEntry(zip, "generated-backend/src/main/java/com/generated/backend/GeneratedBackendApplication.java",
                    buildMainClass());

            String migrationSql = sqlMigrationBuilder.build(entities, attributesByEntity, relationships,
                    tableNameByEntityId);
            writeEntry(zip, "generated-backend/src/main/resources/db/migration/V1__init.sql", migrationSql);
            String base = "generated-backend/src/main/java/com/generated/backend/";
            writeEntry(zip, base + "config/CorsConfig.java", loadTemplate("CorsConfig.java.txt"));
            writeEntry(zip, base + "ai/OllamaClient.java", loadTemplate("OllamaClient.java.txt"));
            writeEntry(zip, base + "ai/AiCommandService.java", loadTemplate("AiCommandService.java.txt"));
            writeEntry(zip, base + "ai/AiController.java", loadTemplate("AiController.java.txt"));
            for (DiagramEntity entity : entities) {
                String className = classNameByEntityId.get(entity.getId());
                String tableName = tableNameByEntityId.get(entity.getId());
                List<generatedField> fields = buildFields(entity, attributesByEntity.get(entity.getId()), relationships,
                        tableNameByEntityId);

                writeEntry(zip, base + "model/" + className + ".java",
                        javaTemplateBuilder.buildModel(BASE_PACKAGE, className, tableName, fields));
                writeEntry(zip, base + "repository/" + className + "Repository.java",
                        javaTemplateBuilder.buildRepository(BASE_PACKAGE, className));
                writeEntry(zip, base + "service/" + className + "Service.java",
                        javaTemplateBuilder.buildService(BASE_PACKAGE, className));
                writeEntry(zip, base + "controller/" + className + "Controller.java",
                        javaTemplateBuilder.buildController(BASE_PACKAGE, className, tableName));
            }
        }

        return buffer.toByteArray();
    }

    private List<generatedField> buildFields(DiagramEntity entity, List<DiagramAttribute> attributes,
            List<DiagramRelationship> relationships, Map<UUID, String> tableNameByEntityId) {
        List<generatedField> fields = new ArrayList<>();
        for (DiagramAttribute attr : attributes) {
            fields.add(new generatedField(
                    nameUtils.toFieldName(attr.getName()),
                    typeMapper.toJavaType(attr.getDataType()),
                    nameUtils.toTableName(attr.getName()),
                    attr.isPrimaryKey()));
        }
        for (DiagramRelationship rel : relationships) {
            if (!rel.getTargetEntity().getId().equals(entity.getId()))
                continue;
            if (rel.getRelationshipType() == DiagramRelationship.RelationshipType.MANY_TO_MANY)
                continue;
            String sourceTable = tableNameByEntityId.get(rel.getSourceEntity().getId());
            fields.add(
                    new generatedField(nameUtils.toFieldName(sourceTable) + "Id", "UUID", sourceTable + "_id", false));
        }
        return fields;
    }

    private void writeEntry(ZipOutputStream zip, String path, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(path));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private String buildPomXml() {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
                    <modelVersion>4.0.0</modelVersion>
                    <parent>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-parent</artifactId>
                        <version>4.0.8</version>
                        <relativePath/>
                    </parent>
                    <groupId>com.generated</groupId>
                    <artifactId>backend</artifactId>
                    <version>0.0.1-SNAPSHOT</version>
                    <name>GeneratedBackend</name>
                    <properties>
                        <java.version>17</java.version>
                    </properties>
                    <dependencies>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-webmvc</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-data-jpa</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-flyway</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.flywaydb</groupId>
                            <artifactId>flyway-database-postgresql</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.postgresql</groupId>
                            <artifactId>postgresql</artifactId>
                            <scope>runtime</scope>
                        </dependency>
                        <dependency>
                            <groupId>com.fasterxml.jackson.core</groupId>
                            <artifactId>jackson-databind</artifactId>
                            <version>2.20.0</version>
                        </dependency>
                        <dependency>
                            <groupId>com.fasterxml.jackson.datatype</groupId>
                            <artifactId>jackson-datatype-jsr310</artifactId>
                            <version>2.20.0</version>
                        </dependency>
                        <dependency>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <optional>true</optional>
                        </dependency>
                    </dependencies>
                    <build>
                        <plugins>
                            <plugin>
                                <groupId>org.springframework.boot</groupId>
                                <artifactId>spring-boot-maven-plugin</artifactId>
                            </plugin>
                            <plugin>
                                <groupId>org.apache.maven.plugins</groupId>
                                <artifactId>maven-compiler-plugin</artifactId>
                                <configuration>
                                    <annotationProcessorPaths>
                                        <path>
                                            <groupId>org.projectlombok</groupId>
                                            <artifactId>lombok</artifactId>
                                        </path>
                                    </annotationProcessorPaths>
                                </configuration>
                            </plugin>
                        </plugins>
                    </build>
                </project>
                """;
    }

    private String buildApplicationYml() {
        return """
                spring:
                  datasource:
                    url: jdbc:postgresql://localhost:5432/generated_db
                    username: postgres
                    password: postgres
                  jpa:
                    hibernate:
                      ddl-auto: validate
                    show-sql: true
                  flyway:
                    enabled: true
                    locations: classpath:db/migration
                server:
                  port: 8081
                ollama:
                  url: ${OLLAMA_URL:http://localhost:11434}
                  model: ${OLLAMA_MODEL:qwen2.5:3b}
                """;
    }

    private String buildMainClass() {
        return """
                package com.generated.backend;

                import org.springframework.boot.SpringApplication;
                import org.springframework.boot.autoconfigure.SpringBootApplication;

                @SpringBootApplication
                public class GeneratedBackendApplication {
                    public static void main(String[] args) {
                        SpringApplication.run(GeneratedBackendApplication.class, args);
                    }
                }
                """;
    }
}