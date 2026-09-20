package com.erdtool.backend.io;

import com.erdtool.backend.model.*;
import com.erdtool.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ArchitectXmlService {

    private final DiagramEntityRepository entityRepository;
    private final DiagramAttributeRepository attributeRepository;
    private final DiagramRelationshipRepository relationshipRepository;
    private final ProjectRepository projectRepository;

    public byte[] export(UUID projectId) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado: " + projectId));
        List<DiagramEntity> entities = entityRepository.findByProjectId(projectId);
        List<DiagramRelationship> relationships = relationshipRepository.findByProjectId(projectId);

        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = dbf.newDocumentBuilder();
        Document doc = db.newDocument();

        Element root = doc.createElement("architect-project");
        root.setAttribute("version", "1.0");
        doc.appendChild(root);

        Element projectEl = doc.createElement("project");
        projectEl.setAttribute("name", project.getName());
        root.appendChild(projectEl);

        Element tablesEl = doc.createElement("tables");
        root.appendChild(tablesEl);

        for (DiagramEntity entity : entities) {
            Element tableEl = doc.createElement("table");
            tableEl.setAttribute("id", entity.getId().toString());
            tableEl.setAttribute("name", entity.getName());
            tableEl.setAttribute("x", String.valueOf(entity.getPosX()));
            tableEl.setAttribute("y", String.valueOf(entity.getPosY()));

            Element columnsEl = doc.createElement("columns");
            List<DiagramAttribute> attributes = attributeRepository.findByEntityIdOrderByOrderIndex(entity.getId());
            for (DiagramAttribute attr : attributes) {
                Element colEl = doc.createElement("column");
                colEl.setAttribute("id", attr.getId().toString());
                colEl.setAttribute("name", attr.getName());
                colEl.setAttribute("type", attr.getDataType());
                colEl.setAttribute("primaryKey", String.valueOf(attr.isPrimaryKey()));
                colEl.setAttribute("foreignKey", String.valueOf(attr.isForeignKey()));
                colEl.setAttribute("nullable", String.valueOf(attr.isNullable()));
                colEl.setAttribute("unique", String.valueOf(attr.isUnique()));
                if (attr.getDefaultValue() != null) {
                    colEl.setAttribute("defaultValue", attr.getDefaultValue());
                }
                columnsEl.appendChild(colEl);
            }
            tableEl.appendChild(columnsEl);
            tablesEl.appendChild(tableEl);
        }

        Element relationshipsEl = doc.createElement("relationships");
        root.appendChild(relationshipsEl);

        for (DiagramRelationship rel : relationships) {
            Element relEl = doc.createElement("relationship");
            relEl.setAttribute("id", rel.getId().toString());
            if (rel.getName() != null) relEl.setAttribute("name", rel.getName());
            relEl.setAttribute("sourceTable", rel.getSourceEntity().getId().toString());
            relEl.setAttribute("targetTable", rel.getTargetEntity().getId().toString());
            relEl.setAttribute("type", rel.getRelationshipType().name());
            relEl.setAttribute("associationType", rel.getAssociationType().name());
            relEl.setAttribute("sourceCardinality", rel.getSourceCardinality());
            relEl.setAttribute("targetCardinality", rel.getTargetCardinality());
            relationshipsEl.appendChild(relEl);
        }

        return toBytes(doc);
    }

    private byte[] toBytes(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        transformer.transform(new DOMSource(doc), new StreamResult(out));
        return out.toByteArray();
    }

    public void importInto(UUID projectId, InputStream xmlInput) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado: " + projectId));

        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder db = dbf.newDocumentBuilder();
        Document doc = db.parse(xmlInput);
        doc.getDocumentElement().normalize();

        Map<String, DiagramEntity> entityByXmlId = new HashMap<>();

        NodeList tableNodes = doc.getElementsByTagName("table");
        for (int i = 0; i < tableNodes.getLength(); i++) {
            Element tableEl = (Element) tableNodes.item(i);
            String xmlId = tableEl.getAttribute("id");
            String name = tableEl.getAttribute("name");

            DiagramEntity entity = new DiagramEntity();
            entity.setProject(project);
            entity.setName(name);
            entity.setPosX(parseIntSafe(tableEl.getAttribute("x"), 100));
            entity.setPosY(parseIntSafe(tableEl.getAttribute("y"), 100));
            entity = entityRepository.save(entity);
            entityByXmlId.put(xmlId, entity);

            NodeList columnNodes = tableEl.getElementsByTagName("column");
            int orderIndex = 0;
            for (int j = 0; j < columnNodes.getLength(); j++) {
                Element colEl = (Element) columnNodes.item(j);
                DiagramAttribute attr = new DiagramAttribute();
                attr.setEntity(entity);
                attr.setName(colEl.getAttribute("name"));
                String type = colEl.getAttribute("type");
                attr.setDataType(type.isEmpty() ? "VARCHAR" : type);
                attr.setPrimaryKey(Boolean.parseBoolean(colEl.getAttribute("primaryKey")));
                attr.setForeignKey(Boolean.parseBoolean(colEl.getAttribute("foreignKey")));
                String nullableAttr = colEl.getAttribute("nullable");
                attr.setNullable(nullableAttr.isEmpty() || Boolean.parseBoolean(nullableAttr));
                attr.setUnique(Boolean.parseBoolean(colEl.getAttribute("unique")));
                String defaultValue = colEl.getAttribute("defaultValue");
                if (!defaultValue.isEmpty()) attr.setDefaultValue(defaultValue);
                attr.setOrderIndex(orderIndex++);
                attributeRepository.save(attr);
            }
        }

        NodeList relNodes = doc.getElementsByTagName("relationship");
        for (int i = 0; i < relNodes.getLength(); i++) {
            Element relEl = (Element) relNodes.item(i);
            DiagramEntity source = entityByXmlId.get(relEl.getAttribute("sourceTable"));
            DiagramEntity target = entityByXmlId.get(relEl.getAttribute("targetTable"));
            if (source == null || target == null) continue;

            DiagramRelationship rel = new DiagramRelationship();
            rel.setProject(project);
            rel.setSourceEntity(source);
            rel.setTargetEntity(target);
            String name = relEl.getAttribute("name");
            if (!name.isEmpty()) rel.setName(name);

            rel.setRelationshipType(parseEnumSafe(DiagramRelationship.RelationshipType.class,
                    relEl.getAttribute("type"), DiagramRelationship.RelationshipType.ONE_TO_MANY));
            rel.setAssociationType(parseEnumSafe(DiagramRelationship.AssociationType.class,
                    relEl.getAttribute("associationType"), DiagramRelationship.AssociationType.ASSOCIATION));

            String sourceCard = relEl.getAttribute("sourceCardinality");
            String targetCard = relEl.getAttribute("targetCardinality");
            if (!sourceCard.isEmpty()) rel.setSourceCardinality(sourceCard);
            if (!targetCard.isEmpty()) rel.setTargetCardinality(targetCard);

            relationshipRepository.save(rel);
        }
    }

    private int parseIntSafe(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return fallback;
        }
    }

    private <T extends Enum<T>> T parseEnumSafe(Class<T> enumClass, String value, T fallback) {
        try {
            return Enum.valueOf(enumClass, value);
        } catch (Exception e) {
            return fallback;
        }
    }
}