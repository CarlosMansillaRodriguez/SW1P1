import { useState } from 'react';
import type { AssociationType, DiagramRelationship } from '../types/models';

interface Props {
  relationship: DiagramRelationship;
  onClose: () => void;
  onSave: (payload: { associationType: AssociationType; sourceCardinality: string; targetCardinality: string; name: string; relationshipType: DiagramRelationship['relationshipType'] }) => void;
}

const CARDINALITY_OPTIONS = ['0..1', '1', '0..*', '1..*', '*'];
const ASSOCIATION_OPTIONS: AssociationType[] = ['ASSOCIATION', 'GENERALIZATION', 'AGGREGATION', 'COMPOSITION'];
const RELATIONSHIP_TYPE_OPTIONS: DiagramRelationship['relationshipType'][] = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY'];

export default function RelationshipEditModal({ relationship, onClose, onSave }: Props) {
  const [associationType, setAssociationType] = useState<AssociationType>(relationship.associationType);
  const [relationshipType, setRelationshipType] = useState(relationship.relationshipType);
  const [sourceCardinality, setSourceCardinality] = useState(relationship.sourceCardinality);
  const [targetCardinality, setTargetCardinality] = useState(relationship.targetCardinality);
  const [name, setName] = useState(relationship.name || '');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 320 }}>
        <h3 style={{ marginTop: 0 }}>Editar relación</h3>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Tipo de asociación
          <select value={associationType} onChange={e => setAssociationType(e.target.value as AssociationType)} style={{ width: '100%' }}>
            {ASSOCIATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Cardinalidad (para generar el backend)
          <select value={relationshipType} onChange={e => setRelationshipType(e.target.value as DiagramRelationship['relationshipType'])} style={{ width: '100%' }}>
            {RELATIONSHIP_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Cardinalidad origen
          <select value={sourceCardinality} onChange={e => setSourceCardinality(e.target.value)} style={{ width: '100%' }}>
            {CARDINALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Cardinalidad destino
          <select value={targetCardinality} onChange={e => setTargetCardinality(e.target.value)} style={{ width: '100%' }}>
            {CARDINALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          Verbo (ej: "pertenece a")
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={() => onSave({ associationType, relationshipType, sourceCardinality, targetCardinality, name })}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}