package com.erdtool.backend.generator;

import com.erdtool.backend.model.DiagramAttribute;
import com.erdtool.backend.model.DiagramEntity;
import com.erdtool.backend.model.DiagramRelationship;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

public class sqlMigrationBuilder {

    public static String build(List<DiagramEntity> entities,
            Map<UUID, List<DiagramAttribute>> attributesByEntity,
            List<DiagramRelationship> relationships,
            Map<UUID, String> tableNameByEntityId) {
        StringBuilder sql = new StringBuilder();
        Set<UUID> hostsWithClass = relationshipRules.hostsWithClass(relationships);
        sql.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;\n\n");

        for (DiagramEntity entity : entities) {
            String tableName = tableNameByEntityId.get(entity.getId());
            List<DiagramAttribute> attributes = attributesByEntity.getOrDefault(entity.getId(), List.of());
            List<String> columnLines = new ArrayList<>();

            boolean hasPrimaryKey = attributes.stream().anyMatch(DiagramAttribute::isPrimaryKey);
            if (!hasPrimaryKey) {
                columnLines.add("id UUID PRIMARY KEY DEFAULT gen_random_uuid()");
            }

            for (DiagramAttribute attr : attributes) {
                String columnName = nameUtils.toTableName(attr.getName());
                StringBuilder line = new StringBuilder();
                line.append(columnName).append(" ").append(typeMapper.toSqlType(attr.getDataType()));
                if (attr.isPrimaryKey()) {
                    line.append(" PRIMARY KEY DEFAULT gen_random_uuid()");
                } else {
                    if (!attr.isNullable())
                        line.append(" NOT NULL");
                    if (attr.isUnique())
                        line.append(" UNIQUE");
                    if (attr.getDefaultValue() != null && !attr.getDefaultValue().isBlank()) {
                        line.append(" DEFAULT '").append(attr.getDefaultValue()).append("'");
                    }
                }
                columnLines.add(line.toString());
            }

            for (DiagramRelationship rel : relationships) {
                for (relationshipRules.ForeignKey fk : relationshipRules.foreignKeys(rel)) {
                    if (!fk.owner().getId().equals(entity.getId()))
                        continue;
                    String referencedTable = tableNameByEntityId.get(fk.referenced().getId());
                    columnLines.add(referencedTable + "_id UUID REFERENCES " + referencedTable + "(id)"
                            + (fk.unique() ? " UNIQUE" : ""));
                }
            }

            sql.append("CREATE TABLE ").append(tableName).append(" (\n    ");
            sql.append(String.join(",\n    ", columnLines));
            sql.append("\n);\n\n");
        }

        for (DiagramRelationship rel : relationships) {
            if (!relationshipRules.generatesJoinTable(rel, hostsWithClass))
                continue;
            String sourceTable = tableNameByEntityId.get(rel.getSourceEntity().getId());
            String targetTable = tableNameByEntityId.get(rel.getTargetEntity().getId());
            String joinTable = sourceTable + "_" + targetTable;
            sql.append("CREATE TABLE ").append(joinTable).append(" (\n");
            sql.append("    ").append(sourceTable).append("_id UUID NOT NULL REFERENCES ").append(sourceTable)
                    .append("(id) ON DELETE CASCADE,\n");
            sql.append("    ").append(targetTable).append("_id UUID NOT NULL REFERENCES ").append(targetTable)
                    .append("(id) ON DELETE CASCADE,\n");
            sql.append("    PRIMARY KEY (").append(sourceTable).append("_id, ").append(targetTable).append("_id)\n");
            sql.append(");\n\n");
        }

        return sql.toString();
    }
}