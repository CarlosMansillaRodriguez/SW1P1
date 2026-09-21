ALTER TABLE relationships DROP CONSTRAINT IF EXISTS relationships_association_type_check;
ALTER TABLE relationships ALTER COLUMN association_type TYPE VARCHAR(30);
ALTER TABLE relationships ADD CONSTRAINT relationships_association_type_check
    CHECK (association_type IN ('ASSOCIATION','DIRECTED_ASSOCIATION','GENERALIZATION','AGGREGATION',
                                'COMPOSITION','DEPENDENCY','REALIZATION','ASSOCIATION_CLASS'));

ALTER TABLE relationships
    ADD COLUMN target_relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE;

-- limpia las generalizaciones viejas para que cumplan la regla (sin verbo ni cardinalidad)
UPDATE relationships
   SET name = NULL, source_cardinality = '', target_cardinality = ''
 WHERE association_type = 'GENERALIZATION';