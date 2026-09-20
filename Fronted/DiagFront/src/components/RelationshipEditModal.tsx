import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { AssociationType, DiagramRelationship } from '../types/models';
import './RelationshipEditModal.css';

interface Props {
  relationship: DiagramRelationship;
  onClose: () => void;
  onSave: (payload: { associationType: AssociationType; sourceCardinality: string; targetCardinality: string; name: string; relationshipType: DiagramRelationship['relationshipType'] }) => void;
  onDelete: () => void;
  onSwap: () => void;
}

const CARDINALITY_OPTIONS = ['0..1', '1', '0..*', '1..*', '*'];
const ASSOCIATION_LABELS: Record<AssociationType, string> = {
  ASSOCIATION: 'Asociación',
  GENERALIZATION: 'Generalización',
  AGGREGATION: 'Agregación',
  COMPOSITION: 'Composición',
};
const RELATIONSHIP_TYPE_LABELS: Record<DiagramRelationship['relationshipType'], string> = {
  ONE_TO_ONE: 'Uno a uno',
  ONE_TO_MANY: 'Uno a muchos',
  MANY_TO_MANY: 'Muchos a muchos',
};

export default function RelationshipEditModal({ relationship, onClose, onSave, onDelete, onSwap }: Props) {
  const [associationType, setAssociationType] = useState<AssociationType>(relationship.associationType);
  const [relationshipType, setRelationshipType] = useState(relationship.relationshipType);
  const [sourceCardinality, setSourceCardinality] = useState(relationship.sourceCardinality);
  const [targetCardinality, setTargetCardinality] = useState(relationship.targetCardinality);
  const [name, setName] = useState(relationship.name || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Editar relación</h3>

        {associationType !== 'ASSOCIATION' && (
          <button className="btn modal-swap-btn" onClick={onSwap}>
            <ArrowLeftRight size={14} /> Invertir dirección de la flecha
          </button>
        )}

        <label className="modal-field">
          Tipo de asociación
          <select value={associationType} onChange={e => setAssociationType(e.target.value as AssociationType)}>
            {Object.entries(ASSOCIATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="modal-field">
          Cardinalidad (para generar el backend)
          <select value={relationshipType} onChange={e => setRelationshipType(e.target.value as DiagramRelationship['relationshipType'])}>
            {Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        {relationshipType === 'MANY_TO_MANY' && (
          <p className="modal-hint">
            Al generar el backend, esto crea automáticamente una tabla intermedia (tabla de unión) en la base de datos — no hace falta que la dibujes vos.
          </p>
        )}

        <div className="modal-field-row">
          <label className="modal-field">
            Cardinalidad origen
            <select value={sourceCardinality} onChange={e => setSourceCardinality(e.target.value)}>
              {CARDINALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>

          <label className="modal-field">
            Cardinalidad destino
            <select value={targetCardinality} onChange={e => setTargetCardinality(e.target.value)}>
              {CARDINALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>

        <label className="modal-field">
          Verbo (ej: "pertenece a")
          <input value={name} onChange={e => setName(e.target.value)} placeholder="pertenece a" />
        </label>

        <div className="modal-actions modal-actions--split">
          <button className="btn btn-danger" onClick={onDelete}>Eliminar</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={() => onSave({ associationType, relationshipType, sourceCardinality, targetCardinality, name })}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}