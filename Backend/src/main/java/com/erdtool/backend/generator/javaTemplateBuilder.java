package com.erdtool.backend.generator;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class javaTemplateBuilder {

    public static String buildModel(String basePackage, String className, String tableName, List<generatedField> fields) {
        Set<String> extraImports = new LinkedHashSet<>();
        for (generatedField f : fields) {
            String imp = typeMapper.toJavaImport(f.javaType());
            if (imp != null) extraImports.add(imp);
        }

        StringBuilder sb = new StringBuilder();
        sb.append("package ").append(basePackage).append(".model;\n\n");
        sb.append("import jakarta.persistence.*;\n");
        sb.append("import lombok.Getter;\n");
        sb.append("import lombok.Setter;\n");
        sb.append("import java.util.UUID;\n");
        for (String imp : extraImports) {
            sb.append("import ").append(imp).append(";\n");
        }
        sb.append("\n@Entity\n@Table(name = \"").append(tableName).append("\")\n@Getter @Setter\n");
        sb.append("public class ").append(className).append(" {\n\n");

        boolean hasExplicitPk = fields.stream().anyMatch(generatedField::primaryKey);
        if (!hasExplicitPk) {
            sb.append("    @Id\n    @GeneratedValue\n    private UUID id;\n\n");
        }

        for (generatedField f : fields) {
            if (f.primaryKey()) sb.append("    @Id\n    @GeneratedValue\n");
            sb.append("    @Column(name = \"").append(f.columnName()).append("\")\n");
            sb.append("    private ").append(f.javaType()).append(" ").append(f.fieldName()).append(";\n\n");
        }

        sb.append("}\n");
        return sb.toString();
    }

    public static String buildRepository(String basePackage, String className) {
        return "package " + basePackage + ".repository;\n\n" +
               "import " + basePackage + ".model." + className + ";\n" +
               "import org.springframework.data.jpa.repository.JpaRepository;\n" +
               "import java.util.UUID;\n\n" +
               "public interface " + className + "Repository extends JpaRepository<" + className + ", UUID> {\n}\n";
    }

    public static String buildService(String basePackage, String className) {
        String v = nameUtils.toFieldName(className);
        return "package " + basePackage + ".service;\n\n" +
               "import " + basePackage + ".model." + className + ";\n" +
               "import " + basePackage + ".repository." + className + "Repository;\n" +
               "import lombok.RequiredArgsConstructor;\n" +
               "import org.springframework.stereotype.Service;\n" +
               "import java.util.List;\n" +
               "import java.util.UUID;\n\n" +
               "@Service\n@RequiredArgsConstructor\n" +
               "public class " + className + "Service {\n" +
               "    private final " + className + "Repository " + v + "Repository;\n\n" +
               "    public " + className + " create(" + className + " " + v + ") {\n" +
               "        return " + v + "Repository.save(" + v + ");\n    }\n\n" +
               "    public " + className + " findById(UUID id) {\n" +
               "        return " + v + "Repository.findById(id)\n" +
               "                .orElseThrow(() -> new RuntimeException(\"" + className + " no encontrado: \" + id));\n    }\n\n" +
               "    public List<" + className + "> findAll() {\n        return " + v + "Repository.findAll();\n    }\n\n" +
               "    public " + className + " update(UUID id, " + className + " changes) {\n" +
               "        " + className + " existing = findById(id);\n" +
               "        // TODO: copiar los campos que correspondan de \"changes\"\n" +
               "        return " + v + "Repository.save(existing);\n    }\n\n" +
               "    public void delete(UUID id) {\n        " + v + "Repository.deleteById(id);\n    }\n}\n";
    }

    public static String buildController(String basePackage, String className, String tableName) {
        String v = nameUtils.toFieldName(className);
        return "package " + basePackage + ".controller;\n\n" +
               "import " + basePackage + ".model." + className + ";\n" +
               "import " + basePackage + ".service." + className + "Service;\n" +
               "import lombok.RequiredArgsConstructor;\n" +
               "import org.springframework.web.bind.annotation.*;\n" +
               "import java.util.List;\n" +
               "import java.util.UUID;\n\n" +
               "@RestController\n@RequestMapping(\"/api/" + tableName + "\")\n@RequiredArgsConstructor\n" +
               "public class " + className + "Controller {\n" +
               "    private final " + className + "Service " + v + "Service;\n\n" +
               "    @PostMapping\n    public " + className + " create(@RequestBody " + className + " " + v + ") {\n" +
               "        return " + v + "Service.create(" + v + ");\n    }\n\n" +
               "    @GetMapping\n    public List<" + className + "> findAll() {\n        return " + v + "Service.findAll();\n    }\n\n" +
               "    @GetMapping(\"/{id}\")\n    public " + className + " findById(@PathVariable UUID id) {\n        return " + v + "Service.findById(id);\n    }\n\n" +
               "    @PutMapping(\"/{id}\")\n    public " + className + " update(@PathVariable UUID id, @RequestBody " + className + " changes) {\n        return " + v + "Service.update(id, changes);\n    }\n\n" +
               "    @DeleteMapping(\"/{id}\")\n    public void delete(@PathVariable UUID id) {\n        " + v + "Service.delete(id);\n    }\n}\n";
    }
}